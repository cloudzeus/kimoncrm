/**
 * Generate an HTML email signature for a user
 */
export async function generateEmailSignature(
  userId: string,
  db: any
): Promise<string> {
  try {
    // Fetch user with department, workPosition, and contact
    const user = await db.user.findUnique({
      where: { id: userId },
      include: {
        department: true,
        workPosition: true,
        contact: {
          select: {
            workPhone: true,
            mobilePhone: true,
            homePhone: true,
            email: true,
          },
        },
      },
    });

    if (!user) {
      return '';
    }

    // Fetch company details (first company in database or use defaults)
    const company = await db.company.findFirst({
      select: {
        name: true,
        email: true,
        phone: true,
        website: true,
      },
    }) || {
      name: 'Advanced Integrated Communication Ltd.',
      email: 'info@aic.gr',
      phone: '+30 210 661 5360',
      website: 'https://www.aic.gr',
    };

    // Get user contact details
    const userPhone = user.workPhone || user.phone || user.contact?.workPhone || user.contact?.homePhone || '';
    const userMobile = user.mobile || user.contact?.mobilePhone || '+30 694 096 0701';
    const userEmail = user.email;
    const userName = user.name || 'User';
    const positionTitle = user.workPosition?.title || '';
    const departmentName = user.department?.name || '';

    // Build department description
    let deptDescription = '';
    if (departmentName === 'ICT' || departmentName === 'Sales' || departmentName === 'Presales') {
      deptDescription = 'Wireless Network Solution | Telecommunication & Information Systems';
    } else {
      deptDescription = departmentName;
    }

    const signature = `
    <style type="text/css">
      body,
      p,
      div,
      table,
      td {
        margin: 0;
        padding: 0;
        font-family: Arial, sans-serif;
      }

      /* This ensures proper rendering in Outlook */
      table {
        border-collapse: collapse;
        mso-table-lspace: 0pt;
        mso-table-rspace: 0pt;
      }

      img {
        -ms-interpolation-mode: bicubic;
        display: block;
        border: 0;
      }

      a {
        text-decoration: none;
      }

      @media screen and (max-width: 480px) {
        .signature-container {
          width: 100% !important;
        }

        .logo-container {
          width: 20% !important;
        }

        .content-container {
          width: 80% !important;
        }
      }
    </style>
    
    <!-- Outlook-compatible signature -->
    <table
      cellspacing="0"
      cellpadding="0"
      border="0"
      style="
        width: 100%;
        max-width: 500px;
        font-family: Arial, sans-serif;
        color: #000000;
        font-size: 10px;
        line-height: 1.2;
      "
      class="signature-container"
    >
      <tr>
        <td
          style="width: 15%; padding-right: 6px; vertical-align: top"
          class="logo-container"
        >
          <table cellspacing="0" cellpadding="0" border="0" width="100%">
            <tr>
              <td align="left">
                <img
                  src="https://videoConf.b-cdn.net/aic.png"
                  alt="AIC Logo"
                  width="63"
                  height="auto"
                  style="width: 100%; max-width: 63px; height: auto"
                />
              </td>
            </tr>
            <tr>
              <td height="70"></td>
            </tr>
            <tr>
              <td>
                <table cellspacing="0" cellpadding="0" border="0" width="100%">
                  <tr>
                    <td width="50%" align="left">
                      <img
                        src="https://privateshare.b-cdn.net/iso27001.jpg"
                        alt="ISO 27001"
                        width="32"
                        height="auto"
                        style="width: 100%; max-width: 32px; height: auto"
                      />
                    </td>
                    <td width="50%" align="left">
                      <img
                        src="https://privateshare.b-cdn.net/iso9001.jpg"
                        alt="ISO 9001"
                        width="32"
                        height="auto"
                        style="width: 100%; max-width: 32px; height: auto"
                      />
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </td>
        <td
          style="
            width: 70%;
            border-left: 2px solid #1e73be;
            padding-left: 8px;
            vertical-align: top;
          "
          class="content-container"
        >
          <table cellspacing="0" cellpadding="0" border="0" width="100%">
            <tr>
              <td style="font-weight: bold; font-size: 13px">
                ${userName}
              </td>
            </tr>
            ${positionTitle ? `
            <tr>
              <td
                style="
                  color: #0c64c0;
                  font-size: 11px;
                  font-weight: 500;
                  padding-top: 2px;
                "
              >
                ${positionTitle}
              </td>
            </tr>
            ` : ''}
            <tr>
              <td style="font-weight: bold; font-size: 10px; padding-top: 2px">
                ${company.name}
              </td>
            </tr>
            ${deptDescription ? `
            <tr>
              <td style="color: #0c64c0; font-size: 9.5px; padding-top: 2px">
                ${deptDescription}
              </td>
            </tr>
            ` : ''}
            <tr>
              <td height="10"></td>
            </tr>
            <tr>
              <td>
                <span style="color: #f26c4f; font-weight: bold">A</span>: 8 Samou Str. - Glyka Nera - Attica - Greece - 15354
              </td>
            </tr>
            <tr>
              <td style="padding-top: 2px">
                <span style="color: #f26c4f; font-weight: bold">P</span>: ${company.phone || '+30 210 661 5360'}${userMobile ? ` - <span style="color: #f26c4f; font-weight: bold">M</span>: ${userMobile}` : ''}
              </td>
            </tr>
            <tr>
              <td style="padding-top: 2px">
                <span style="color: #f26c4f; font-weight: bold">E</span>:
                <a href="mailto:${userEmail}" style="color: #000000">${userEmail}</a>
                &nbsp;|&nbsp;
                <span style="color: #f26c4f; font-weight: bold">W</span>:
                <a href="${company.website || 'https://www.aic.gr'}" style="color: #000000">${company.website || 'https://www.aic.gr'}</a>
              </td>
            </tr>
            <tr>
              <td height="10"></td>
            </tr>
            <tr>
              <td>
                <a
                  href="https://www.linkedin.com/company/advanced-integrated-communication/"
                  target="_blank"
                >
                  <img
                    src="https://videoConf.b-cdn.net/linkedin.png"
                    alt="LinkedIn"
                    width="48"
                    height="auto"
                    style="width: 48px; height: auto; vertical-align: middle"
                  />
                </a>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
    `;

    return signature;
  } catch (error) {
    console.error('Error generating email signature:', error);
    return '';
  }
}
