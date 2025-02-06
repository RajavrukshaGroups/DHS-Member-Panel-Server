console.log('MemberRoutes.js is being loaded');
const express = require('express');
const bcrypt = require('bcryptjs');
const bodyParser = require('body-parser');
const router = express.Router();
const conn = require('../config/config')
const path = require('path');
const {sendOtpEmail ,sendContactFormEmail, sendContactAdminEmail } = require('../utils/Middlewear');
// const memberController =require('../controller/memberController.js')
// Clear require cache for memberController
// delete require.cache[require.resolve('../controller/memberController.js')];
const memberController = require('../controller/memberController.js');
console.log('Requiring memberController from:', require.resolve('../controller/memberController.js'));

router.get('/mheader', (req, res) => {
  const seniority_id = req.query.seniority_id; 
  console.log("this is header seniority_id ",seniority_id)

  if (!seniority_id) {
      return res.status(400).json({ error: 'Seniority ID not found in session' });
  }

  const query = 'SELECT user_email FROM th_user WHERE senior_id = ?';
  conn.query(query, [seniority_id], (err, results) => {
      if (err) {
          console.error('Error executing query:', err);
          return res.status(500).json({ error: 'Internal server error' });
      }

      res.json(results);
  });
});




router.post('/mlogin', (req, res) => { 
  const { seniority_id, password } = req.body;

  if (!seniority_id || !password) {
    return res.status(400).json({ error: 'Please provide both seniority_id and password' });
  }

  const query = 'SELECT user_epwd FROM th_user WHERE senior_id = ?';

  conn.query(query, [seniority_id], (err, results) => {
    if (err) {
      console.error('Error executing query:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }

    if (results.length === 0) {
      return res.status(401).json({ error: 'Invalid seniority_id or password' });
    }

    const user = results[0];

    if (password !== user.user_epwd) {
      return res.status(401).json({ error: 'Invalid seniority_id or password' });
    }

    // If validation is successful, redirect to the dashboard
    res.json({ message: 'Login successful', redirectUrl: '/dashboard', seniority_id });
  });
});


// Fetch user data API
router.get('/dashboard', (req, res) => {
  const seniority_id = req.query.seniority_id;

  if (!seniority_id) {
    return res.status(400).json({ error: 'Please provide a seniority_id' });
  }

  const query = `select username , senior_id , 	user_photo ,user_pk  from th_user where senior_id=?`;

  conn.query(query, [seniority_id], (err, results) => {
    if (err) {
      console.error('Error executing query:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }

    res.json(results);
  });
}); 


// Fetch user data API
router.get('/fetchUserData', (req, res) => {
  const seniority_id = req.query.seniority_id;

  if (!seniority_id) {
    return res.status(400).json({ error: 'Please provide a seniority_id' });
  }

  const query = `
   SELECT th_user.user_pk, 
       th_user.username,
       th_user.senior_id,
       th_user.user_status,
       th_user_project.user_project_pk, 
       th_user_project.project_fk,
       th_projects.project_id, 
       th_projects.pro_name, 
       th_user_project.prop_dimension,
       th_user_project.sqft_rate, 
       th_user_project.property_price,
       SUM(th_receipt.payment_amnt) - 2500 AS paid_amount,
       CASE WHEN th_user.user_status = 0 THEN 'Active' ELSE 'Inactive' END AS status
FROM th_user
JOIN th_user_project ON th_user_project.user_fk = th_user.user_pk
JOIN th_projects ON th_projects.project_id = th_user_project.project_fk
LEFT JOIN th_receipt ON th_receipt.user_fk = th_user.member_pid
WHERE th_user.senior_id = ?
GROUP BY th_user.user_pk, 
         th_user.username, 
         th_user.user_status,
         th_user_project.user_project_pk, 
         th_user_project.project_fk,
         th_projects.project_id, 
         th_projects.pro_name, 
         th_user_project.prop_dimension,
         th_user_project.sqft_rate, 
         th_user_project.property_price
LIMIT 0, 25`;

  conn.query(query, [seniority_id], (err, results) => {
    if (err) {
      console.error('Error executing query:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }

    res.json(results);
  });
}); 


router.get('/fetchReceipts', (req, res) => {
  const seniority_id = req.query.seniority_id;

  if (!seniority_id) {
    return res.status(400).json({ error: 'Please provide a seniority_id' });
  }

  // Query to fetch member_pid and join with th_receipt
  const query = `
    SELECT th_receipt.receipt_pk,
           th_receipt.receipt_date,
           th_receipt.receipt_no,
           th_receipt.payment_mode,
           th_receipt.cheque_dd_transaction_id,
           th_receipt.payment_amnt
    FROM th_user
    JOIN th_receipt ON th_user.member_pid = th_receipt.user_fk
    WHERE th_user.senior_id = ?
  `;

  conn.query(query, [seniority_id], (err, results) => {
    if (err) {
      console.error('Error executing query:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }

    res.json(results);
  });
});

router.get('/transferproject', (req, res) => {
  const seniority_id = req.query.seniority_id;

  if (!seniority_id) {
    return res.status(400).json({ error: 'Please provide a seniority_id' });
  }

  // Query to fetch member_pid and join with th_receipt
  const query = `
 SELECT 
    tpt.*,
    tp.pro_name 
FROM 
    th_project_transfer tpt
JOIN 
    th_projects tp 
ON 
    tp.project_id = tpt.project_fk
WHERE 
    tpt.user_fk_from != 0 
    AND tpt.user_fk_to != 0 
    AND tpt.seniority_id = ?
ORDER BY 
    tpt.project_trans_pk DESC
  `;

  conn.query(query, [seniority_id], (err, results) => {
    if (err) {
      console.error('Error executing query:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }

    res.json(results);
  });
});

router.get('/getUserPk',(req,res)=>{
  const seniority_id = req.query.seniority_id;
  if (!seniority_id) {
    return res.status(400).json({ error: 'Please provide a seniority_id' });
  }
  // Query to fetch member_pid and join with th_receipt
  const query = `
  SELECT user_pk FROM th_user WHERE senior_id=?
  `;
  conn.query(query, [seniority_id], (err, results) => {
    if (err) {
      console.error('Error executing query:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
    res.json(results);
  });
})

router.post('/resetpassword', async (req, res) => {
  const { seniorityId, password } = req.body;

  if (!seniorityId) {
    return res.status(400).json({ error: 'Please provide a seniority_id' });
  }
  if (!password) {
    return res.status(400).json({ error: 'Please provide a password' });
  }

  // SQL query to update the password
  const updateQuery = `
    UPDATE th_user
    SET user_epwd = ?
    WHERE senior_id = ?;
  `;
  
  // SQL query to fetch user details
  const selectQuery = `
    SELECT user_email, username, user_epwd
    FROM th_user
    WHERE senior_id = ?;
  `;

  conn.query(updateQuery, [password, seniorityId], (err, results) => {
    if (err) {
      console.error('Error executing update query:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }

    // Fetch user details
    conn.query(selectQuery, [seniorityId], async (err, rows) => {
      if (err) {
        console.error('Error executing select query:', err);
        return res.status(500).json({ error: 'Internal server error' });
      }

      if (rows.length === 0) {
        return res.status(404).json({ error: 'User not found' });
      }

      const { user_email, username, user_epwd } = rows[0];
      // Print the email ID to the console
      console.log('User email:', user_email);
      

      try {
        // Send an email with updated credentials
        await sendOtpEmail(
          user_email,
          '', // No OTP
          'Password Reset Notification',
          `Your password has been successfully reset.\n\nUsername: ${username}\nPassword: ${user_epwd}`,
          null // No attachment
        );

        console.log('Password Changed and Email Sent');
        res.json({ message: 'Password updated and email sent' });
      } catch (emailError) {
        console.error('Error sending password reset email:', emailError);
        res.status(500).json({ error: 'Password updated but failed to send email' });
      }
    });
  });
});


router.get('/extracharges',(req,res)=>{
  const seniority_id = req.query.seniority_id;
  if (!seniority_id) {
    return res.status(400).json({ error: 'Please provide a seniority_id' });
  }
  // Query to fetch member_pid and join with th_receipt
  const query = `
    SELECT * 
    FROM th_user_exchg_history AS exh 
    JOIN th_user_extra_charges AS extra 
    ON exh.user_extra_fk = extra.user_extra_pk 
    WHERE extra.user_seniority_id = ?
 
  `;
  conn.query(query, [seniority_id], (err, results) => {
    if (err) {
      console.error('Error executing query:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
    res.json(results);
  });
})

router.get('/projectstatus',(req,res)=>{
  const seniority_id = req.query.seniority_id;
  if (!seniority_id) {
    return res.status(400).json({ error: 'Please provide a seniority_id' });
  }
  // Query to fetch member_pid and join with th_receipt
  const query = `
    SELECT up.project_fk,
      p.pro_name ,
      p.project_pk,
      ps.title,
      ps.desc ,
      ps.status_add_date
FROM 
    th_user_project up
JOIN 
    th_projects p ON up.project_fk = p.project_id
JOIN
    th_project_status ps ON p.project_pk = ps.project_fk

WHERE 
    up.user_seniority_id = ?;

 
  `;
  conn.query(query, [seniority_id], (err, results) => {
    if (err) {
      console.error('Error executing query:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
    res.json(results);
  });


})



router.post('/contact', async (req, res) => {
  try {
    const formData = req.body; // Get form data from request body
    await sendContactFormEmail(formData); // Send email with form data
    res.status(200).send('Contact form submitted successfully'); // Send success response
  } catch (error) {
    console.error('Error sending contact form email:', error); // Log error
    res.status(500).send('Error sending contact form email'); // Send error response
  }
});



// router.post('/brochure', (req, res) => {
//   const { name, email, mobile, address } = req.body;
//   console.log(req.body);

//   const query = 'INSERT INTO brochure_download (name, email, mobile, address) VALUES (?, ?, ?, ?)';

//   conn.query(query, [name, email, mobile, address], (error, results) => {
//     if (error) {
//       console.error('Error saving form data:', error);
//       res.status(500).json({ error: 'Error saving form data' });
//     } else {
//       res.status(200).json({ message: 'Form data saved successfully' });
//     }
//   });
// });

// Contact Admin
// Contact Admin
router.post('/contactadmin', async (req, res) => {
  console.log("API hit");
  const { seniorityId, subject, message } = req.body;
  console.log('Request received:', req.body);

  if (!seniorityId || !subject || !message) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  // Query to get the user_pk based on the seniorityId
  const getUserQuery = `
    SELECT user_pk FROM th_user WHERE senior_id = ?
  `;

  try {
    const [results] = await conn.promise().query(getUserQuery, [seniorityId]);

    if (results.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user_fk = results[0].user_pk;

    // SQL query to insert data into the contactadmin table
    const insertQuery = `
      INSERT INTO contactadmin (user_fk, title, message, date)
      VALUES (?, ?, ?, NOW())
    `;

    await conn.promise().query(insertQuery, [user_fk, subject, message]);
    console.log("before email")

    // Send an email to admin
    await sendContactAdminEmail({ seniorityId, subject, message });
    
    res.status(200).json({ message: 'Message sent, stored, and email sent successfully' });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
// Application Download
router.post('/submitApplication', (req, res) => {
  const { name, email, mobile, address } = req.body;

  if (!name || !email || !mobile || !address) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  const insertQuery = `
    INSERT INTO application_download (name, email, mobile, address , download_date)
    VALUES (?, ?, ?, ?, NOW())
  `;

  conn.query(insertQuery, [name, email, mobile, address], (err, results) => {
    if (err) {
      console.error('Error inserting data:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
    res.status(200).json({ message: 'Data saved successfully' });
  });
});

router.post('/brochure', (req, res) => {
  const { name, email, mobile, address } = req.body;

  if (!name || !email || !mobile || !address) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  const insertQuery = `
    INSERT INTO brochure_download (name, email, mobile, address, download_date)
    VALUES (?, ?, ?, ?, NOW())
  `;

  conn.query(insertQuery, [name, email, mobile, address], (err, results) => {
    if (err) {
      console.error('Error inserting data:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
    res.status(200).json({ message: 'Data saved successfully' });
  });
});


// router.post('/submitPopupData',memberController.popupSubmit)
router.post('/submitPopupData', memberController.popupSubmit);




module.exports = router;