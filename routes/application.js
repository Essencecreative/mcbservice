const express = require('express');
const router = express.Router();
const { Resend } = require('resend');

// Initialize Resend
const resend = new Resend(process.env.RESEND_API_KEY);

// Email template for application forms
const getApplicationEmailTemplate = (formData, formType = 'Application') => {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>New ${formType} Form Submission</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f4f4f4;
        }
        .container {
            background-color: #ffffff;
            border-radius: 8px;
            padding: 30px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .header {
            background: linear-gradient(135deg, #0a3b73 0%, #0e519a 100%);
            color: white;
            padding: 20px;
            border-radius: 8px 8px 0 0;
            margin: -30px -30px 30px -30px;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            font-size: 24px;
        }
        .content {
            margin: 20px 0;
        }
        .field {
            margin-bottom: 20px;
            padding: 15px;
            background-color: #f9f9f9;
            border-left: 4px solid #0a3b73;
            border-radius: 4px;
        }
        .field-label {
            font-weight: bold;
            color: #0a3b73;
            font-size: 14px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 5px;
        }
        .field-value {
            color: #333;
            font-size: 16px;
            word-wrap: break-word;
        }
        .details-field {
            background-color: #f0f7ff;
            border-left-color: #0e519a;
        }
        .details-field .field-value {
            white-space: pre-wrap;
            line-height: 1.8;
        }
        .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 2px solid #e0e0e0;
            text-align: center;
            color: #666;
            font-size: 12px;
        }
        .timestamp {
            color: #999;
            font-size: 12px;
            margin-top: 10px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📋 New ${formType} Form Submission</h1>
        </div>
        
        <div class="content">
            <div class="field">
                <div class="field-label">Full Name</div>
                <div class="field-value">${formData.name || 'Not provided'}</div>
            </div>
            
            <div class="field">
                <div class="field-label">Email Address</div>
                <div class="field-value">
                    <a href="mailto:${formData.email}" style="color: #0a3b73; text-decoration: none;">${formData.email || 'Not provided'}</a>
                </div>
            </div>
            
            ${formData.phone ? `
            <div class="field">
                <div class="field-label">Phone Number</div>
                <div class="field-value">
                    <a href="tel:${formData.phone}" style="color: #0a3b73; text-decoration: none;">${formData.phone}</a>
                </div>
            </div>
            ` : ''}
            
            ${formData.region ? `
            <div class="field">
                <div class="field-label">City/Region</div>
                <div class="field-value">${formData.region}</div>
            </div>
            ` : ''}
            
            ${formData.selectedOption ? `
            <div class="field">
                <div class="field-label">Selected Option</div>
                <div class="field-value">${formData.selectedOption}</div>
            </div>
            ` : ''}
            
            ${formData.details ? `
            <div class="field details-field">
                <div class="field-label">Message/Details</div>
                <div class="field-value">${formData.details}</div>
            </div>
            ` : ''}
        </div>
        
        <div class="footer">
            <p>This email was sent from the Mwalimu Commercial Bank ${formType} form.</p>
            <p class="timestamp">Received on: ${new Date().toLocaleString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                timeZoneName: 'short'
            })}</p>
        </div>
    </div>
</body>
</html>
  `;
};

// POST /application - Send application form email
router.post('/', async (req, res) => {
  try {
    const { name, email, phone, region, selectedOption, details, formType } = req.body;

    // Validation
    if (!name || !email) {
      return res.status(400).json({ 
        message: 'Name and email are required fields' 
      });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        message: 'Please provide a valid email address' 
      });
    }

    // Check if Resend API key is configured
    if (!process.env.RESEND_API_KEY) {
      console.error('RESEND_API_KEY is not configured. Please set it in .env file');
      return res.status(500).json({ 
        message: 'Email service is not configured. Please contact the administrator.' 
      });
    }

    // Get recipient email (defaults to FROM email if not specified)
    const recipientEmail = process.env.CONTACT_EMAIL || process.env.FROM_EMAIL;
    const fromEmail = process.env.FROM_EMAIL || 'onboarding@resend.dev';

    if (!recipientEmail) {
      console.error('CONTACT_EMAIL or FROM_EMAIL must be set in .env file');
      return res.status(500).json({ 
        message: 'Email service is not configured. Please contact the administrator.' 
      });
    }

    const applicationType = formType || 'Application';
    const formData = {
      name,
      email,
      phone: phone || null,
      region: region || null,
      selectedOption: selectedOption || null,
      details: details || null,
    };

    // Send email using Resend
    const { data, error } = await resend.emails.send({
      from: `Mwalimu Bank ${applicationType} Form <${fromEmail}>`,
      to: [recipientEmail],
      replyTo: email, // Allow replying directly to the sender
      subject: `New ${applicationType} Form Submission from ${name}`,
      html: getApplicationEmailTemplate(formData, applicationType),
      text: `
New ${applicationType} Form Submission

Name: ${name}
Email: ${email}
${phone ? `Phone: ${phone}` : ''}
${region ? `Region: ${region}` : ''}
${selectedOption ? `Selected Option: ${selectedOption}` : ''}
${details ? `\nDetails:\n${details}` : ''}

---
This email was sent from the Mwalimu Commercial Bank ${applicationType} form.
Received on: ${new Date().toLocaleString()}
      `.trim(),
    });

    if (error) {
      console.error('Resend error:', error);
      return res.status(500).json({ 
        message: 'Failed to submit application. Please try again later.' 
      });
    }

    res.status(200).json({ 
      message: 'Thank you for your submission! We will contact you soon.' 
    });
  } catch (error) {
    console.error('Error sending application email:', error);
    res.status(500).json({ 
      message: 'Failed to submit application. Please try again later or contact us directly.' 
    });
  }
});

module.exports = router;

