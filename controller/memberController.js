const nodemailer = require('nodemailer');
// const conn = require('../config/config');




const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const popupSubmit = async (req, res) => {

  const { name, email, number, message,location } = req.body;
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: "info@defencehousingsociety.com",
    subject: `Contact Us Form Submission: ${message}`,
    html: `
      <div style="font-family: Arial, sans-serif; color: #333;">
        <h2 style="font-weight: bold;">New Contact Us Form Submission</h2>
        <p><strong>Name:</strong> <span style="font-weight: bold;">${name}</span></p>
        <p><strong>Phone:</strong> ${number}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Location:</strong> ${location}</p>
        <p><strong>Subject:</strong> ${message}</p>
      </div>
    `,
  };
 
  try {
    await transporter.sendMail(mailOptions);
    console.log("Contact form email sent successfully");
    res
      .status(200)
      .json({ message: "Your details have been sent successfully!" });
  } catch (error) {
    res
      .status(500)     
      .json({ message: "Failed to send details. Please try again later." });
    console.error("Error sending contact form email:", error);

    throw error;
  }     
};

// ------------------------------------------------
                    

module.exports = {
  popupSubmit,
  
};

