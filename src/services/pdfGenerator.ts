import { DefectDetection } from '../lib/supabase';

export function generatePDFReport(detection: DefectDetection, imageDataUrl: string) {
  const date = new Date(detection.created_at).toLocaleString();
  const hasDefects = detection.crack_detected;

  const content = `
    <div style="border-bottom: 3px solid #1e40af; padding-bottom: 20px; margin-bottom: 30px;">
      <h1 style="margin: 0; color: #1e40af; font-size: 28px;">Product Defect Detection Report</h1>
      <p style="margin: 5px 0 0 0; color: #666; font-size: 14px;">AI-Powered Inspection System</p>
    </div>

    <div style="margin-bottom: 30px;">
      <h2 style="color: #1e40af; font-size: 20px; margin-bottom: 15px;">Detection Summary</h2>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 10px; border: 1px solid #ddd; background: #f8f9fa; font-weight: bold; width: 40%;">Report ID</td>
          <td style="padding: 10px; border: 1px solid #ddd;">${detection.id}</td>
        </tr>
        <tr>
          <td style="padding: 10px; border: 1px solid #ddd; background: #f8f9fa; font-weight: bold;">Analysis Date</td>
          <td style="padding: 10px; border: 1px solid #ddd;">${date}</td>
        </tr>
        <tr>
          <td style="padding: 10px; border: 1px solid #ddd; background: #f8f9fa; font-weight: bold;">Image Name</td>
          <td style="padding: 10px; border: 1px solid #ddd;">${detection.image_name}</td>
        </tr>
        <tr>
          <td style="padding: 10px; border: 1px solid #ddd; background: #f8f9fa; font-weight: bold;">Product Type</td>
          <td style="padding: 10px; border: 1px solid #ddd;">${detection.detection_result.detailed_product_type || detection.window_type || 'N/A'}</td>
        </tr>
        ${detection.detection_result.window_count > 0 || detection.detection_result.door_count > 0 ? `
        <tr>
          <td style="padding: 10px; border: 1px solid #ddd; background: #f8f9fa; font-weight: bold;">Product Count</td>
          <td style="padding: 10px; border: 1px solid #ddd;">
            ${detection.detection_result.window_count > 0 ? `${detection.detection_result.window_count} Window${detection.detection_result.window_count !== 1 ? 's' : ''}` : ''}
            ${detection.detection_result.window_count > 0 && detection.detection_result.door_count > 0 ? ', ' : ''}
            ${detection.detection_result.door_count > 0 ? `${detection.detection_result.door_count} Door${detection.detection_result.door_count !== 1 ? 's' : ''}` : ''}
          </td>
        </tr>
        ` : ''}
        ${detection.detection_result.window_types?.length > 0 || detection.detection_result.door_types?.length > 0 ? `
        <tr>
          <td style="padding: 10px; border: 1px solid #ddd; background: #f8f9fa; font-weight: bold;">Specific Types</td>
          <td style="padding: 10px; border: 1px solid #ddd;">
            ${detection.detection_result.window_types?.length > 0 ? `Windows: ${detection.detection_result.window_types.join(', ')}` : ''}
            ${detection.detection_result.window_types?.length > 0 && detection.detection_result.door_types?.length > 0 ? '<br>' : ''}
            ${detection.detection_result.door_types?.length > 0 ? `Doors: ${detection.detection_result.door_types.join(', ')}` : ''}
          </td>
        </tr>
        ` : ''}
        <tr>
          <td style="padding: 10px; border: 1px solid #ddd; background: #f8f9fa; font-weight: bold;">Defects Detected</td>
          <td style="padding: 10px; border: 1px solid #ddd; color: ${hasDefects ? '#dc2626' : '#16a34a'}; font-weight: bold;">
            ${hasDefects ? 'YES' : 'NO'}
          </td>
        </tr>
        <tr>
          <td style="padding: 10px; border: 1px solid #ddd; background: #f8f9fa; font-weight: bold;">Confidence Score</td>
          <td style="padding: 10px; border: 1px solid #ddd;">${detection.confidence_score || 0}%</td>
        </tr>
      </table>
    </div>

    ${hasDefects ? `
      <div style="margin-bottom: 30px;">
        <h2 style="color: #1e40af; font-size: 20px; margin-bottom: 15px;">Detected Defects</h2>
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="background: #1e40af; color: white;">
              <th style="padding: 12px; border: 1px solid #ddd; text-align: left;">#</th>
              <th style="padding: 12px; border: 1px solid #ddd; text-align: left;">Type</th>
              <th style="padding: 12px; border: 1px solid #ddd; text-align: left;">Severity</th>
              <th style="padding: 12px; border: 1px solid #ddd; text-align: left;">Confidence</th>
            </tr>
          </thead>
          <tbody>
            ${detection.detection_result.cracks.map((crack, idx) => `
              <tr>
                <td style="padding: 10px; border: 1px solid #ddd;">${idx + 1}</td>
                <td style="padding: 10px; border: 1px solid #ddd; text-transform: capitalize;">${crack.type}</td>
                <td style="padding: 10px; border: 1px solid #ddd; text-transform: capitalize; color: ${
                  crack.severity === 'severe' ? '#dc2626' : crack.severity === 'moderate' ? '#f59e0b' : '#16a34a'
                }; font-weight: bold;">${crack.severity}</td>
                <td style="padding: 10px; border: 1px solid #ddd;">${crack.confidence}%</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    ` : ''}

    <div style="margin-bottom: 30px;">
      <h2 style="color: #1e40af; font-size: 20px; margin-bottom: 15px;">AI Analysis</h2>
      <p style="line-height: 1.6; color: #333; padding: 15px; background: #f8f9fa; border-left: 4px solid #1e40af;">
        ${detection.detection_result.analysis || 'No additional analysis available.'}
      </p>
    </div>

    <div style="margin-bottom: 30px;">
      <h2 style="color: #1e40af; font-size: 20px; margin-bottom: 15px;">Analyzed Image</h2>
      <div style="text-align: center; padding: 20px; background: #f8f9fa; border: 2px solid #ddd;">
        <img src="${imageDataUrl}" style="max-width: 100%; height: auto; border: 1px solid #ccc;" />
      </div>
    </div>

    <div style="margin-top: 50px; padding-top: 20px; border-top: 2px solid #e5e7eb; text-align: center; color: #666; font-size: 12px;">
      <p>This report was generated automatically by AI Product Defect Detection System</p>
      <p>© ${new Date().getFullYear()} - For professional use only</p>
    </div>
  `;

  const reportWindow = window.open('', '_blank');
  if (!reportWindow) return;

  const title = `Product_Report_${detection.id.slice(0, 8)}`;

  reportWindow.document.write(`
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <title>${title}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <style>
          @page {
            margin: 20mm;
          }
          body {
            margin: 0;
            padding: 20mm;
            font-family: Arial, sans-serif;
            background: #f3f4f6;
          }
        </style>
      </head>
      <body>
        ${content}
      </body>
    </html>
  `);

  reportWindow.document.close();
  reportWindow.focus();
}
