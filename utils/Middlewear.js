const crypto = require('crypto');
const nodemailer = require('nodemailer');
const path = require('path');

// // Create a transporter instance
// const transporter = nodemailer.createTransport({
//   service: 'gmail',
//   auth: {
//     user: process.env.EMAIL_USER,
//     pass: process.env.EMAIL_PASS,
//   },
// });

// // Generate OTP and Form ID
// const generateOtp = () => {
//   const otp = crypto.randomInt(100000, 999999).toString();
//   const formId = crypto.randomUUID();
//   return { otp, formId };
// };

// // Send OTP Email
// const sendOtpEmail = async (email, otp, subject, message, attachmentPath) => {
//   const mailOptions = {
//     from: process.env.EMAIL_USER,
//     to: email,
//     subject: subject || 'Your OTP for Form Submission',
//     text: message || `Your OTP is: ${otp}`,
//     attachments: attachmentPath ? [{
//       filename: path.basename(attachmentPath), // Only the PDF filename
//       path: attachmentPath // Full path to the PDF file
//     }] : [], // Attach file if path is provided
//   };

//   try {
//     await transporter.sendMail(mailOptions);
//     console.log('OTP email sent successfully with attachment');
//   } catch (error) {
//     console.error('Error sending OTP email:', error);
//     throw error; // Rethrow the error to handle it upstream
//   }
// };

// Create a transporter instance
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Generate OTP and Form ID
const generateOtp = () => {
  const otp = crypto.randomInt(100000, 999999).toString();
  const formId = crypto.randomUUID();
  return { otp, formId };
};

// Send OTP Email to User and Attachment to Admin
const sendOtpEmail = async (userEmail, otp, subject, message, attachmentPath) => {
  // Send email to the user (with OTP and optional attachment)
  const userMailOptions = {
    from: process.env.EMAIL_USER,
    to: userEmail,
    subject: subject || 'Your OTP for Form Submission',
    text: message || `Your OTP is: ${otp}`,
    attachments: attachmentPath
      ? [{
          filename: path.basename(attachmentPath), // Only the PDF filename
          path: attachmentPath // Full path to the PDF file
        }]
      : [], // Attach file if path is provided
  };

  try {
    // Send email to user
    await transporter.sendMail(userMailOptions);
    console.log('OTP email sent successfully to user');

    // If attachment exists, send it to admin without OTP
    if (attachmentPath) {
      const adminMailOptions = {
        from: process.env.EMAIL_USER,
        to: process.env.EMAIL_USER, // Send to admin email (yourself)
        subject: 'Admin Copy: Form Submission Attachment',
        text: 'The user has submitted a form. See the attached file.',
        attachments: [{
          filename: path.basename(attachmentPath), // Only the PDF filename
          path: attachmentPath // Full path to the PDF file
        }],
      };

      await transporter.sendMail(adminMailOptions);
      console.log('Attachment sent successfully to admin');
    }

  } catch (error) {
    console.error('Error sending OTP or attachment:', error);
    throw error; // Rethrow the error to handle it upstream
  }
};


// Function to send email for the Contact Us form
const sendContactAdminEmail = async (formData) => {
  const { seniorityId, subject, message } = formData;
  // Query to get the admin email address
  const adminEmail = 'info@defencehousingsociety.com'; // Replace with your admin email
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: adminEmail,
    subject: `Contact Admin From Defence Website: ${subject}`, // Use backticks here
    text: `
       New Contact Admin Form Submission:
      Seniority ID: ${seniorityId}
      Subject: ${subject}
      Message: ${message}`
  }; 

  try {
    await transporter.sendMail(mailOptions);
    console.log('Contact Admin form email sent successfully');
  } catch (error) {
    console.error('Error sending Contact Admin form email:', error);
    throw error; // Rethrow the error to handle it upstream
  }
}

const sendContactFormEmail = async (formData) => {
  const { name, phone, email, subject, message } = formData;

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: 'technical@rajavrukshagroup.in', // The recipient email address
    subject: `Contact Us Form Submission: ${subject}`,
    text: `
      New Contact Us Form Submission:

      Name: ${name}
      Phone: ${phone}
      Email: ${email}
      Subject: ${subject}
      Message: ${message}
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Contact form email sent successfully');
  } catch (error) {
    console.error('Error sending contact form email:', error);
    throw error; // Rethrow the error to handle it upstream
  }
};

module.exports = { generateOtp, sendOtpEmail, sendContactFormEmail, sendContactAdminEmail };
