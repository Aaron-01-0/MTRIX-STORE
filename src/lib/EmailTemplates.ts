export type EmailTemplateType = 'minimal' | 'showcase' | 'newsletter' | 'custom' | 'builder' | 'launch';

export interface EmailTemplateData {
    title?: string;
    heroImage?: string;
    body?: string;
    ctaText?: string;
    ctaLink?: string;
    sections?: { title: string; content: string }[]; // For newsletter
}

export const generateEmailHtml = (type: EmailTemplateType, data: EmailTemplateData): string => {
    const { title, heroImage, body, ctaText, ctaLink, sections } = data;

    const baseStyles = `
        font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
        line-height: 1.6;
        color: #333;
        max-width: 600px;
        margin: 0 auto;
        padding: 20px;
    `;

    const buttonStyle = `
        display: inline-block;
        background-color: #000;
        color: #0f0;
        padding: 12px 24px;
        text-decoration: none;
        font-weight: bold;
        border-radius: 4px;
        margin-top: 20px;
        text-transform: uppercase;
        letter-spacing: 1px;
    `;

    const containerStyle = `
        background-color: #ffffff;
        border: 1px solid #e5e5e5;
        border-radius: 8px;
        overflow: hidden;
    `;

    const headerStyle = `
        background-color: #000;
        color: #fff;
        padding: 20px;
        text-align: center;
    `;

    switch (type) {
        case 'minimal':
            return `
                <div style="${baseStyles}">
                    <div style="${containerStyle}">
                        <div style="padding: 40px; text-align: center;">
                            ${title ? `<h1 style="margin-bottom: 20px; font-size: 24px;">${title}</h1>` : ''}
                            ${body ? `<p style="color: #666; margin-bottom: 30px;">${body.replace(/\n/g, '<br/>')}</p>` : ''}
                            ${ctaText && ctaLink ? `<a href="${ctaLink}" style="${buttonStyle}">${ctaText}</a>` : ''}
                        </div>
                    </div>
                    <div style="text-align: center; margin-top: 20px; font-size: 12px; color: #999;">
                        &copy; ${new Date().getFullYear()} MTRIX. All rights reserved.
                    </div>
                </div>
            `;

        case 'showcase':
            return `
                <div style="${baseStyles}">
                    <div style="${containerStyle}">
                        ${heroImage ? `<img src="${heroImage}" alt="Hero" style="width: 100%; height: auto; display: block;" />` : ''}
                        <div style="padding: 30px;">
                            ${title ? `<h1 style="font-size: 28px; font-weight: 800; margin-bottom: 15px; text-transform: uppercase;">${title}</h1>` : ''}
                            ${body ? `<p style="font-size: 16px; color: #444; margin-bottom: 25px;">${body.replace(/\n/g, '<br/>')}</p>` : ''}
                            ${ctaText && ctaLink ? `<a href="${ctaLink}" style="${buttonStyle} width: 100%; text-align: center; box-sizing: border-box;">${ctaText}</a>` : ''}
                        </div>
                    </div>
                    <div style="text-align: center; margin-top: 20px; font-size: 12px; color: #999;">
                        &copy; ${new Date().getFullYear()} MTRIX. All rights reserved.
                    </div>
                </div>
            `;

        case 'newsletter':
            return `
                <div style="${baseStyles}">
                    <div style="${containerStyle}">
                        <div style="${headerStyle}">
                            <h1 style="margin: 0; font-size: 24px; letter-spacing: 2px;">MTRIX DIGEST</h1>
                        </div>
                        ${heroImage ? `<img src="${heroImage}" alt="Hero" style="width: 100%; height: auto; display: block;" />` : ''}
                        <div style="padding: 30px;">
                            ${title ? `<h2 style="margin-top: 0;">${title}</h2>` : ''}
                            ${body ? `<p>${body.replace(/\n/g, '<br/>')}</p>` : ''}
                            
                            ${sections ? sections.map(section => `
                                <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
                                    <h3 style="margin-bottom: 10px;">${section.title}</h3>
                                    <p style="color: #666;">${section.content}</p>
                                </div>
                            `).join('') : ''}

                            ${ctaText && ctaLink ? `<div style="text-align: center; margin-top: 40px;"><a href="${ctaLink}" style="${buttonStyle}">${ctaText}</a></div>` : ''}
                        </div>
                    </div>
                    <div style="text-align: center; margin-top: 20px; font-size: 12px; color: #999;">
                        &copy; ${new Date().getFullYear()} MTRIX. All rights reserved.
                    </div>
                </div>
            `;

        case 'launch':
            return `
                <div style="${baseStyles} background-color: #000; color: #fff;">
                    <div style="${containerStyle} background-color: #0c0c0c; border: 1px solid #333;">
                        <div style="position: relative; text-align: center; overflow: hidden;">
                            <div style="background: linear-gradient(180deg, rgba(0,0,0,0) 0%, #0c0c0c 100%); position: absolute; bottom: 0; left: 0; width: 100%; height: 50px;"></div>
                            <img src="https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExeWxvNHR6aHhzZnh6Znh6Znh6Znh6Znh6Znh6Znh6Znh6Znh6Znh6/TqiwHbFBaZ4ti/giphy.gif" alt="Matrix Rain" style="width: 100%; height: 200px; object-fit: cover; opacity: 0.6;" />
                        </div>
                        <div style="padding: 30px; text-align: center;">
                            <h1 style="color: #D4AF37; font-size: 36px; margin: 0 0 10px; font-family: 'Courier New', monospace; letter-spacing: -1px;">SYSTEM ONLINE</h1>
                            <p style="color: #D4AF37; font-size: 14px; text-transform: uppercase; letter-spacing: 4px; margin-bottom: 40px; opacity: 0.7;">Initialize Sequence...</p>
                            
                            <div style="border: 1px solid #333; padding: 25px; border-radius: 4px; margin-bottom: 30px; background: #080808;">
                                <h3 style="color: #fff; margin: 0 0 10px; font-weight: normal;">Exclusive Access Reward</h3>
                                <p style="color: #888; margin: 0; font-size: 14px;">
                                    Use code <strong style="color: #D4AF37;">LAUNCH20</strong> for 20% off your first order.
                                </p>
                            </div>

                            <p style="color: #aaa; margin-bottom: 30px; line-height: 1.6; font-size: 16px;">
                                The wait is over. Experience the seamless fusion of art and technology. Our first collection is now live.
                            </p>

                            <a href="https://mtrix.store" style="${buttonStyle} background-color: #D4AF37; color: #000; border: none; padding: 15px 40px; font-size: 16px;">
                                ENTER STORE
                            </a>
                        </div>
                    </div>
                    <div style="text-align: center; margin-top: 20px; font-size: 12px; color: #444;">
                        MTRIX Store &copy; ${new Date().getFullYear()}
                    </div>
                </div>
            `;

        default:
            return '';
    }
};
