# Email Configuration Guide - Resend (Recommended)

This guide explains how to quickly set up email functionality using **Resend** - the easiest and fastest email service.

## Why Resend?

✅ **Super Easy Setup** - Just an API key, no SMTP configuration  
✅ **Free Tier** - 3,000 emails/month free  
✅ **Fast & Reliable** - Built for developers  
✅ **No Domain Verification Needed** - Works immediately with their domain  

## Quick Setup (5 minutes)

### Step 1: Sign up for Resend

1. Go to [https://resend.com](https://resend.com)
2. Click "Sign Up" (you can use GitHub/Google for faster signup)
3. Verify your email

### Step 2: Get Your API Key

1. Once logged in, go to **API Keys** in the sidebar
2. Click **"Create API Key"**
3. Give it a name (e.g., "Contact Form")
4. Copy the API key (you'll only see it once!)

### Step 3: Configure Your .env File

Add these variables to your `.env` file:

```env
# Resend Configuration (EASIEST OPTION)
RESEND_API_KEY=re_your_api_key_here

# Where to send contact form emails
CONTACT_EMAIL=your-email@example.com

# From email (must be verified in Resend or use their default)
FROM_EMAIL=onboarding@resend.dev
```

### Step 4: Verify Your Email (Optional but Recommended)

1. In Resend dashboard, go to **Domains**
2. Click **"Add Domain"** and follow the instructions
3. Or use their default `onboarding@resend.dev` for testing

**That's it!** Your contact form is now ready to send emails.

---

## Alternative: SendGrid (Also Easy)

If you prefer SendGrid, here's how:

### Step 1: Sign up
1. Go to [https://sendgrid.com](https://sendgrid.com)
2. Sign up (free tier: 100 emails/day)

### Step 2: Create API Key
1. Go to Settings → API Keys
2. Create API Key with "Full Access"
3. Copy the key

### Step 3: Update .env
```env
SENDGRID_API_KEY=SG.your_api_key_here
CONTACT_EMAIL=your-email@example.com
FROM_EMAIL=noreply@yourdomain.com
```

Then update `routes/contact.js` to use SendGrid instead of Resend.

---

## Testing

After configuration:

1. Navigate to `/contact` on your website
2. Fill out and submit the form
3. Check your `CONTACT_EMAIL` inbox
4. You should receive a beautifully formatted email!

## Troubleshooting

- **"Email service is not configured"**: Make sure `RESEND_API_KEY` is set in `.env`
- **"Failed to send message"**: Check that your API key is correct
- **Emails going to spam**: Verify your domain in Resend or use their verified domain
- **Rate limits**: Free tier has limits, upgrade if needed

## Free Tier Limits

- **Resend**: 3,000 emails/month
- **SendGrid**: 100 emails/day

Both are perfect for contact forms!
