const fs = require('fs').promises; // Use promises-based fs module
const path = require('path');
const puppeteer = require('puppeteer');
const { sendOtpEmail } = require('./Middlewear'); // Import the email sending function

let globalBase64Image;

async function imageToBase64(imagePath) {
    try {
        // Read image file as buffer using fs.promises.readFile
        const imageBuffer = await fs.readFile(imagePath);
  
        // Convert buffer to Base64 string with the specified format
        const base64String = `data:image/jpeg;base64,${imageBuffer.toString('base64')}`;
  
        return base64String;
    } catch (error) {
        console.error('Error reading image file:', error);
        throw error; // Rethrow the error to handle it outside this function
    }
  }


  const imagePath = 'bANNER_DHS1.jpg'
  imageToBase64(imagePath)
    .then(base64Image => {
        // Assign the Base64 image string to the global variable
        globalBase64Image = base64Image;
        
    })
    .catch(error => {
        console.error('Error converting image to Base64:', error);
    });

    const generatePdf = async (formattedData) => {
        
        try {
            let htmlTemplate = await fs.readFile('./Templates/online.html', 'utf8');
            htmlTemplate = htmlTemplate.replace('{{name}}', formattedData.referenceName)
                .replace('{{designation}}', formattedData.referenceRank)
                .replace('{{serviceid}}', formattedData.referenceServiceId)
                .replace('{{applicantrelationship}}', formattedData.referenceRelationship)
                .replace('{{dimension}}', formattedData.propertySize)
                .replace('{{project}}', formattedData.propertyName)
                .replace('{{propertytype}}', formattedData.propertyType)
                .replace('{{applicantname}}', formattedData.personalName)
                .replace('{{dob}}', formattedData.dob)
                .replace('{{age}}',formattedData.age)
                .replace('{{fatherSpouseName}}', formattedData.fatherSpouseName)
                .replace('{{correspondenceAddress}}', formattedData.caddress)
                .replace('{{permanentAddress}}', formattedData.paddress)
                .replace('{{workingAddress}}', formattedData.waddress)
                .replace('{{nomineName}}', formattedData.nomineeName)
                .replace('{{nomineeAge}}', formattedData.nomineeAge)
                .replace('{{nomineRelationship}}', formattedData.nomineeRelationship)
                .replace('{{nomineAddress}}', formattedData.nomineeAddress)
                .replace('{{remark}}', formattedData.remark)
                .replace('{{phone}}', formattedData.phone)
                .replace('{{mobile}}', formattedData.phone)
                .replace('{{email}}', formattedData.email)
                .replace("{{cheque/dd/online}}", formattedData.memRefnum)
                .replace("{{bank}}", formattedData.memBankname)
                .replace("{{branch}}", formattedData.memBranch)
                .replace("{{advance}}", formattedData.amount)
                .replace("{{inwords}}", formattedData.amountInWords)
                .replace("{{sitepurchasecheque}}", formattedData.memRefnum)
                .replace("{{sitepurchasebank}}", formattedData.bankName)
                .replace("{{sitepurchasebranch}}", formattedData.branchName)
                .replace("{{currentDate}}",formattedData.currentDate)
                .replace("{{place}}",formattedData.place)
                .replace("{{imageheader}}", globalBase64Image)
                .replace("{{signature}}", `data:image/jpeg;base64,${formattedData.signaturePhotoBase64}`)
                .replace("{{applicantImage}}", `data:image/jpeg;base64,${formattedData.personalPhotoBase64}`);
              
            const tempHtmlPath = path.join(__dirname, 'temp.html');
            await fs.writeFile(tempHtmlPath, htmlTemplate, 'utf8');
      
            // const browser = await puppeteer.launch({
            //     args: ['--no-sandbox', '--disable-setuid-sandbox'],
            // });
            
            const browser = await puppeteer.launch({
    executablePath: '/bin/chromium-browser', // Specify the path to the installed Chromium
    args: ['--no-sandbox', '--disable-setuid-sandbox'], // Keep these flags to avoid permission issues
});

            const page = await browser.newPage();
            const baseUrl = 'file://' + __dirname + '/';
            await page.goto(baseUrl + 'temp.html', { waitUntil: 'networkidle2', timeout: 30000 });
      
            const pdfDirectory = path.join(__dirname, 'pdf_files');
            const pdfFileName = `${formattedData.personalName}.pdf`;
            const pdfPath = path.join(pdfDirectory, pdfFileName);
            await page.pdf({
              path: pdfPath,
              format: 'Legal',
              printBackground: true,
              preferCSSPageSize: false,
              margin: {
                // top: '10mm',
                bottom: '10mm',
                left: '8mm',
                right: '8mm',
              },
            });
      
            await browser.close();
            await fs.unlink(tempHtmlPath); // Remove the temporary HTML file
      
            return pdfPath;
        } catch (error) {
            console.error('Error generating PDF:', error);
            throw error;
        }
    };


const fileExists = async (filePath) => {
    try {
        await fs.access(filePath);
        return true;
    } catch {
        return false;
    }
};


// Send the generated PDF via email
const sendPdfViaEmail = async (pdfPath, recipientEmail) => {
    console.log("This is from sendPdfViaEmail api :  ",pdfPath)
    try {
        if (!await fileExists(pdfPath)) {
            throw new Error(`File not found: ${pdfPath}`);
        }

        await sendOtpEmail(
            recipientEmail,
            '',
            'APPLICATION',
           
            `Greetings from Defence Habitat Housing Co-Operative Soceity Ltd.!!!

            We appreciate your association with us and we value your time.

            Your application has been received, one of our executive will get in touch with you very shortly.

            Attached with the filled application for your reference.

            For any Further assistance, you may reach us on 080-29903931.
            Sincerely,

            Defence Habitat Housing Co-Operative Soceity ltd.
            `,
            pdfPath
        );
        // console.log("PDF sent successfully");

        // res.status(200).json({ success: true, message: 'PDF sent successfully' });

        console.log("PDF sent successfully");
    } catch (error) {
        console.error('Error sending PDF email:', error);
        throw error;
    }
};

module.exports = { generatePdf, sendPdfViaEmail };
