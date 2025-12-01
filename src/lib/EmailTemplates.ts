export type EmailTemplateType = 'minimal' | 'showcase' | 'newsletter' | 'custom';

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

        default:
            return '';
    }
};
