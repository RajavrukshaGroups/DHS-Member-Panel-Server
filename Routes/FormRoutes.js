const express = require('express');
const router = express.Router();
const conn = require('../config/config')


const { generatePdf, sendPdfViaEmail } = require('../utils/pdfUtils');

const { generateOtp, sendOtpEmail } = require('../utils/Middlewear');




const otpMap = new Map(); // To store OTPs temporarily

//project dropdown 
router.get('/projectNames', (req, res) => {
  const sql = 'SELECT pro_name, address2, project_pk FROM th_projects';
  conn.query(sql, (err, results) => {
    if (err) {
      console.error('Error fetching project names:', err);
      res.status(500).json({ error: 'Error fetching project names' });
      return;
    }
    res.status(200).json(results);
  });
});


//   plotDimensions dropdown

router.get('/plotDimensions', (req, res) => {
  const sql = `SELECT plotsize_pk,
    CONCAT(plotsize_width, " x ", plotsize_height) AS dimension,
    (plotsize_width * plotsize_height) AS property_size
    FROM th_plotsize`  ;
  conn.query(sql, (err, results) => {
    if (err) {
      console.error('Error fetching plot dimensions:', err);
      res.status(500).json({ error: 'Error fetching plot dimensions' });
      return;
    }
    res.status(200).json(results);
  });
});


router.post('/submit', async (req, res) => {
  const data = req.body;
  // Generate OTP and formId
  const { otp, formId } = generateOtp();

  // Create formatted data object
  const formattedData = {
    // Reference details
    referenceName: data.referenceName,
    referenceRank: data.referenceRank,
    referenceServiceId: data.referenceServiceId,
    referenceRelationship: data.referenceRelationship,

    // Personal details
    personalName: data.personalName,
    dob: data.dob,
    age: data.age,
    fatherSpouseName: data.fatherSpouseName,
    phone: data.phone,
    email: data.email,
    paddress: data.paddress,
    caddress: data.caddress,
    waddress: data.waddress,
    remark: data.remark,
    personalPhotoBase64: data.personalPhotoBase64,
    signaturePhotoBase64: data.signaturePhotoBase64,
    // Property details
    propertyName: data.propertyName,
    propertyType: data.propertyType,
    propertySize: data.propertySize,

    // Nominee variables
    nomineeName: data.nomineeName,
    nomineeAge: data.nomineeAge,
    nomineeRelationship: data.nomineeRelationship,
    nomineeAddress: data.nomineeAddress,

    // Membership payment details
    mempaymentMode: data.mempaymentMode,
    memBankname: data.memBankname,
    memBranch: data.memBranch,
    memPaydate: data.memPaydate,
    memAmount: data.memAmount,
    memRefnum: data.memRefnum,

    // Purchase of site payment details
    paymentType: data.paymentType,
    paymentMode: data.paymentMode,
    bankName: data.bankName,
    branchName: data.branchName,
    amount: data.amount,
    amountInWords: data.amountInWords,
    ddChequeRefNumber: data.ddChequeRefNumber,
    place: data.place,
    currentDate: data.currentDate,
  };


  // Store OTP with the form identifier
  otpMap.set(formId, { otp, formattedData });

  try {
    // Send OTP via email
    await sendOtpEmail(formattedData.email, otp, 'Your OTP for Form Submission', `Your OTP is: ${otp}`);
    // Send response with OTP and formId
    res.json({ message: 'OTP sent', formId });
  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({ message: 'Error sending OTP' });
  }
});





router.post('/verify-otp-and-submit', async (req, res) => {
  const { formId, otp } = req.body;

  console.log("Received formId:", formId);
  console.log("Received OTP:", otp);

  if (!otpMap.has(formId)) {
    console.log("Received formId inside:", formId);
    console.log("Received OTP inside:", otp);
    return res.status(400).json({ success: false, message: 'Invalid form identifier' });
  }

  const { otp: storedOtp, formattedData } = otpMap.get(formId);
  console.log("Stored OTP in otpMap:", storedOtp);
  console.log("User-entered OTP:", otp);

  console.log("This is dimension : ", formattedData.propertySize)

  if (otp === storedOtp) {
    // SQL query to insert data into the database
    const query = `
            INSERT INTO online_application (
                ref_name, ref_designation, ref_id, ref_relationship, name, dob, 
                age, father_spouse_name, phone, email, correspondence_address, permanent_address, 
                working_address, remarks,image , signature , property_name, property_location, property_size, nominee_name, 
                nominee_age, nominee_relationship, nominee_address, membership_payment_mode, membership_payment_bank, membership_payment_branch, 
                membership_payment_date, membership_payment_amount, membership_payment_reference_no, site_payment_type, site_payment_mode, site_payment_bank, 
                site_payment_branch, site_payment_amount, site_payment_amount_in_words, site_payment_reference_no, place, updated_at, date
            ) VALUES (?, ?, ?, ?, ?, ?, 
                      ?, ?, ?, ?, ?, ?,
                      ?, ?, ?, ?, ?, ?,
                      ?, ?, ?, ?, ?, ?,
                      ?, ?, ?, ?, ?, ?,?,?,
                      ?, ?, ?, ?,?, NOW(), NOW())
        `;

    const values = [
      formattedData.referenceName, formattedData.referenceRank, formattedData.referenceServiceId, formattedData.referenceRelationship,
      formattedData.personalName, formattedData.dob, formattedData.age, formattedData.fatherSpouseName,
      formattedData.phone, formattedData.email, formattedData.caddress, formattedData.paddress,
      formattedData.waddress, formattedData.remark, formattedData.personalPhotoBase64, formattedData.signaturePhotoBase64, formattedData.propertyName, formattedData.propertyType,
      formattedData.propertySize, formattedData.nomineeName, formattedData.nomineeAge, formattedData.nomineeRelationship,
      formattedData.nomineeAddress, formattedData.mempaymentMode, formattedData.memBankname, formattedData.memBranch,
      formattedData.memPaydate, formattedData.memAmount, formattedData.memRefnum, formattedData.paymentType,
      formattedData.paymentMode, formattedData.bankName, formattedData.branchName, formattedData.amount,
      formattedData.amountInWords, formattedData.ddChequeRefNumber, formattedData.place, formattedData.currentDate,
    ];


    conn.query(query, values, async (err, result) => {
      if (err) {
        console.error('Error inserting data into the database:', err);
        return res.status(500).json({ success: false, message: 'Database error' });
      }
      otpMap.delete(formId);
      // Clear OTP after successful submission

      try {
        console.log("Starting PDF conversion");
        const pdfPath = await generatePdf(formattedData);

        await sendPdfViaEmail(pdfPath, formattedData.email); // Send PDF via email
        res.sendFile(pdfPath);
      } catch (error) {
        console.error('Error during PDF generation or sending:', error);
        res.status(500).send('Internal Server Error');
      }
    });
  } else {
    res.status(400).json({ success: false, message: 'Invalid OTP' });
  }
});


module.exports = router;