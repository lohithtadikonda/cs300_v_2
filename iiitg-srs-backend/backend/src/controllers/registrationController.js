const db = require('../config/db');

async function createRegistration(req, res) {
  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');

    const settings = await client.query(
      "SELECT value FROM system_settings WHERE key = 'registration_enabled'"
    );

    if (!settings.rows[0]?.value?.enabled) {
      return res.status(403).json({ error: 'Registration is currently disabled' });
    }

    const existing = await client.query(
      "SELECT id FROM registrations WHERE student_id = $1 AND current_stage NOT IN ('rejected')",
      [req.user.id]
    );

    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'You already have an active registration' });
    }

    const { category, formA, formB } = req.body;

    const user = await client.query(
      'SELECT name, roll_no, department FROM users WHERE id = $1',
      [req.user.id]
    );

    const u = user.rows[0];

    const reg = await client.query(
      `INSERT INTO registrations (student_id, student_name, roll_no, department, category, current_stage)
       VALUES ($1, $2, $3, $4, $5, 'draft') RETURNING *`,
      [req.user.id, u.name, u.roll_no, u.department, category]
    );

    const regId = reg.rows[0].id;

    const fa = await client.query(
      'INSERT INTO form_a (registration_id, total_credits, semester, academic_year) VALUES ($1, $2, $3, $4) RETURNING id',
      [regId, formA.totalCredits, formA.semester, formA.academicYear]
    );

    for (const courseId of formA.courseIds) {
      await client.query(
        'INSERT INTO form_a_courses (form_a_id, course_id) VALUES ($1, $2)',
        [fa.rows[0].id, courseId]
      );
    }

    if (formB && (category === '2' || category === '3')) {
      await client.query(
        `INSERT INTO form_b (registration_id, payment_category, tuition_fee, hostel_fee, other_fees, total_fee, late_fine, payment_details)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [regId, formB.paymentCategory, formB.tuitionFee, formB.hostelFee, formB.otherFees, formB.totalFee, formB.lateFine || 0, formB.paymentDetails]
      );
    }

    await client.query(
      `INSERT INTO approvals (registration_id, stage, status, approved_by, approved_at)
       VALUES ($1, 'draft', 'approved', 'System', NOW())`,
      [regId]
    );

    let nextStage = 'section_review';

    await client.query(
      'UPDATE registrations SET current_stage = $1 WHERE id = $2',
      [nextStage, regId]
    );

    await client.query('COMMIT');

    res.status(201).json({
      id: regId,
      message: 'Registration created',
      currentStage: nextStage
    });

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Create registration error:', err);
    res.status(500).json({ error: 'Server error' });
  } finally {
    client.release();
  }
}


async function getMyRegistrations(req, res) {
  try {
    const regs = await db.query(
      `SELECT r.*, 
        json_build_object('totalCredits', fa.total_credits, 'semester', fa.semester, 'academicYear', fa.academic_year) AS form_a,
        CASE WHEN fb.id IS NOT NULL THEN json_build_object(
          'paymentCategory', fb.payment_category, 'tuitionFee', fb.tuition_fee,
          'hostelFee', fb.hostel_fee, 'otherFees', fb.other_fees,
          'totalFee', fb.total_fee, 'lateFine', fb.late_fine, 'paymentDetails', fb.payment_details
        ) END AS form_b
       FROM registrations r
       LEFT JOIN form_a fa ON fa.registration_id = r.id
       LEFT JOIN form_b fb ON fb.registration_id = r.id
       WHERE r.student_id = $1
       ORDER BY r.created_at DESC`,
      [req.user.id]
    );

    for (const reg of regs.rows) {
      const courses = await db.query(
        `SELECT c.* FROM courses c
         JOIN form_a_courses fac ON fac.course_id = c.id
         JOIN form_a fa ON fa.id = fac.form_a_id
         WHERE fa.registration_id = $1`,
        [reg.id]
      );

      if (reg.form_a) reg.form_a.courses = courses.rows;

      const approvals = await db.query(
        'SELECT * FROM approvals WHERE registration_id = $1 ORDER BY created_at',
        [reg.id]
      );

      reg.approvals = approvals.rows;
    }

    res.json(regs.rows);

  } catch (err) {
    console.error('Get registrations error:', err);
    res.status(500).json({ error: 'Server error' });
  }
}


async function getAllRegistrations(req, res) {
  try {
    const { stage, department } = req.query;

    let query = `
      SELECT r.*, 
        json_build_object('totalCredits', fa.total_credits, 'semester', fa.semester, 'academicYear', fa.academic_year) AS form_a,
        CASE WHEN fb.id IS NOT NULL THEN json_build_object(
          'paymentCategory', fb.payment_category, 'tuitionFee', fb.tuition_fee,
          'hostelFee', fb.hostel_fee, 'otherFees', fb.other_fees,
          'totalFee', fb.total_fee, 'lateFine', fb.late_fine, 'paymentDetails', fb.payment_details
        ) END AS form_b
      FROM registrations r
      LEFT JOIN form_a fa ON fa.registration_id = r.id
      LEFT JOIN form_b fb ON fb.registration_id = r.id
      WHERE 1=1`;

    const params = [];

    if (stage) {
      params.push(stage);
      query += ` AND r.current_stage = $${params.length}`;
    }

    if (department) {
      params.push(department);
      query += ` AND r.department = $${params.length}`;
    }

    const role = req.user.role;

    if (role === 'finance') {
      query += ` AND fb.payment_category = 'self_financed' AND r.current_stage = 'section_review'`;
    } else if (role === 'student_affairs') {
      query += ` AND fb.payment_category = 'scholarship' AND r.current_stage = 'section_review'`;
    } else if (role === 'academic_affairs') {
      // ✅ FIXED parentheses
      query += ` AND ((fb.payment_category = 'loan' AND r.current_stage = 'section_review') OR r.current_stage = 'submitted')`;
    }

    query += ' ORDER BY r.created_at DESC';

    const result = await db.query(query, params);

    for (const reg of result.rows) {
      const courses = await db.query(
        `SELECT c.* FROM courses c
         JOIN form_a_courses fac ON fac.course_id = c.id
         JOIN form_a fa ON fa.id = fac.form_a_id
         WHERE fa.registration_id = $1`,
        [reg.id]
      );

      if (reg.form_a) reg.form_a.courses = courses.rows;

      const approvals = await db.query(
        'SELECT * FROM approvals WHERE registration_id = $1 ORDER BY created_at',
        [reg.id]
      );

      reg.approvals = approvals.rows;
    }

    res.json(result.rows);

  } catch (err) {
    console.error('Get all registrations error:', err);
    res.status(500).json({ error: 'Server error' });
  }
}


async function approveRegistration(req, res) {
  const client = await db.pool.connect();

  try {
    await client.query('BEGIN');

    const { id } = req.params;
    const { status, remarks } = req.body;

    const reg = await client.query(
      'SELECT * FROM registrations WHERE id = $1',
      [id]
    );

    if (!reg.rows[0]) {
      return res.status(404).json({ error: 'Registration not found' });
    }

    const currentStage = reg.rows[0].current_stage;

    await client.query(
      `INSERT INTO approvals (registration_id, stage, status, approved_by, approved_by_user_id, remarks, approved_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())
       ON CONFLICT (registration_id, stage)
       DO UPDATE SET status=$3, approved_by=$4, remarks=$6, approved_at=NOW()`,
      [id, currentStage, status, req.user.name, req.user.id, remarks]
    );

    if (status === 'rejected') {
      await client.query(
        `UPDATE registrations 
         SET current_stage = 'rejected',
             remarks = array_append(COALESCE(remarks, '{}'), $2),
             updated_at = NOW()
         WHERE id = $1`,
        [id, remarks || 'Rejected']
      );
    } else {
      const stageFlow = {
        section_review: 'advisor_review',
        advisor_review: 'submitted',
        submitted: 'final_approved',
      };

      const nextStage = stageFlow[currentStage] || 'final_approved';

      await client.query(
        'UPDATE registrations SET current_stage = $1, updated_at = NOW() WHERE id = $2',
        [nextStage, id]
      );
    }

    // ✅ FIX: removed duplicate remarks append

    await client.query('COMMIT');

    res.json({ message: `Registration ${status}` });

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Approve error:', err);
    res.status(500).json({ error: 'Server error' });
  } finally {
    client.release();
  }
}


module.exports = {
  createRegistration,
  getMyRegistrations,
  getAllRegistrations,
  approveRegistration
};