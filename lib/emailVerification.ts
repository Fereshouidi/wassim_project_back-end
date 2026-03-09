import nodemailer from 'nodemailer';

export const sendVerificationTokenByEmail = (
    ownerEmail: string,
    clientEmail: string,
    pass: string,
    lang: 'fr' | 'en' = 'fr', // Default language
    userType: 'client' | 'admin' = 'client' // Recipient type
) => {

    let transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: { user: ownerEmail, pass }
    });

    const generateVerificationCode = () => Math.floor(100000 + Math.random() * 900000);
    const code = generateVerificationCode();

    // Translation texts based on language and user type
    const translations = {
        en: {
            subject: 'Verification Code',
            title: userType === 'admin' ? 'Admin Access Control' : 'Account Verification',
            message: 'Use the following code to complete the process:',
            footer: 'This code is valid for 10 minutes.',
            thanks: 'Thank you for your trust'
        },
        fr: {
            subject: 'Code de Vérification',
            title: userType === 'admin' ? 'Contrôle d\'Accès Admin' : 'Vérification du Compte',
            message: 'Utilisez le code suivant pour terminer le processus :',
            footer: 'Ce code est valide pendant 10 minutes.',
            thanks: 'Merci de votre confiance'
        }
    };

    const t = translations[lang];

    const htmlLayout = `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f3f4f6; padding: 40px; text-align: center;">
            <div style="max-width: 450px; margin: 0 auto; background-color: #ffffff; padding: 40px; border-radius: 30px; border: 1px solid #e5e7eb;">
                <div style="display: inline-block; padding: 10px 20px; background-color: #f9fafb; border-radius: 12px; margin-bottom: 20px;">
                    <span style="font-size: 10px; font-weight: 800; color: #9ca3af; text-transform: uppercase; letter-spacing: 2px;">
                        ${userType} security
                    </span>
                </div>
                
                <h2 style="color: #111827; margin-bottom: 10px; font-size: 22px; font-weight: 800; letter-spacing: -0.5px;">
                    ${t.title}
                </h2>
                
                <p style="color: #4b5563; font-size: 14px; margin-bottom: 30px; line-height: 1.5;">
                    ${t.message}
                </p>
                
                <div style="display: flex; justify-content: center; gap: 8px; margin-bottom: 30px;">
                    ${code.toString().split('').map(digit => `
                        <div style="
                            width: 44px;
                            height: 54px;
                            background-color: #111827;
                            border-radius: 12px;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            font-size: 26px;
                            font-weight: 900;
                            color: #ffffff;
                            line-height: 1;
                        ">${digit}</div>
                    `).join('')}
                </div>
                
                <p style="color: #9ca3af; font-size: 12px; font-style: italic;">
                    ${t.footer}
                </p>
                
                <div style="margin-top: 40px; border-top: 1px solid #f3f4f6; padding-top: 20px;">
                    <p style="font-size: 13px; color: #111827; font-weight: 700;">
                        ${t.thanks}
                    </p>
                </div>
            </div>
        </div>
    `;

    let mailOptions = {
        from: `"Security Team" <${ownerEmail}>`,
        to: clientEmail,
        subject: `${code} - ${t.subject}`,
        html: htmlLayout
    };

    transporter.sendMail(mailOptions, (error, info) => {
    });

    return { code };
};
