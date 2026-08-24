import { Alert } from 'react-native';

/**
 * Generates and downloads/shares a complete, professional Fixam Service Contract PDF locally
 * using expo-print and expo-sharing without redirecting to a browser or showing text links.
 */
export async function exportAgreementPdf({ agreement, booking, locale = 'en' }) {
  try {
    const isFr = locale === 'fr';
    const targetAgreement = agreement || booking?.serviceAgreement || (booking?.serviceAgreements && booking.serviceAgreements[0]) || (booking?.agreements && booking.agreements[0]) || {};
    const bookingData = booking || {};

    let terms = targetAgreement.terms || {};
    if (typeof terms === 'string') {
      try { terms = JSON.parse(terms); } catch (_) { terms = {}; }
    }

    const docNumber = targetAgreement.publicAgreementNumber || `FSA-${new Date().getFullYear()}-${(bookingData.id || targetAgreement.id || 'DOC').substring(0, 8).toUpperCase()}-v1`;
    const dateIssued = new Date(targetAgreement.createdAt || bookingData.createdAt || Date.now()).toLocaleDateString(isFr ? 'fr-FR' : 'en-US', { day: 'numeric', month: 'short', year: 'numeric' });

    const clientRaw = terms.client || bookingData.client || {};
    const providerRaw = terms.provider || bookingData.provider || bookingData.providerDetails || {};
    const scheduleRaw = terms.schedule || {};

    const clientName = clientRaw.name || clientRaw.fullName || 'Client';
    const clientId = clientRaw.id || bookingData.clientId || 'FIXAM-CLI-01';
    const clientPhone = clientRaw.phone || 'Verified on platform';
    const clientEmail = clientRaw.email || 'Verified account';

    const providerName = providerRaw.name || providerRaw.fullName || 'Service Provider';
    const providerId = providerRaw.id || bookingData.providerId || 'FIXAM-PRO-01';
    const providerPhone = providerRaw.phone || 'Verified on platform';
    const providerEmail = providerRaw.email || 'Verified pro account';

    const isTask = targetAgreement.sourceType === 'TASK' || Boolean(targetAgreement.taskId || bookingData.isJob || bookingData.title);
    
    let serviceTitle;
    let serviceCategory;
    let scopeDetails;

    if (isTask) {
      // Exact service type for Jobs/Tasks
      serviceTitle = terms.title || bookingData.title || (isFr ? 'Prestation de service' : 'Professional Task Service');
      serviceCategory = terms.category || bookingData.category || (isFr ? 'Prestation sur mesure' : 'Custom Task Service');
      scopeDetails = terms.scopeOfWork || bookingData.description || (isFr ? 'Exécution des travaux selon le descriptif de la tâche.' : 'Execution of the task as detailed in the posted job request.');
    } else {
      // Direct Booking: derive from provider skills or dynamic booking details
      const providerSkills = Array.isArray(providerRaw.skills) ? providerRaw.skills : (Array.isArray(bookingData.provider?.skills) ? bookingData.provider.skills : (Array.isArray(bookingData.provider?.providerProfile?.skills) ? bookingData.provider.providerProfile.skills : []));
      const primarySkill = providerSkills.length > 0 ? providerSkills[0] : null;

      serviceCategory = terms.category && terms.category !== 'General Service' && terms.category !== 'Home & Maintenance'
        ? terms.category
        : (primarySkill
            ? (isFr ? `Réservation directe (${providerSkills.slice(0, 2).join(', ')})` : `Direct Booking (${providerSkills.slice(0, 2).join(', ')})`)
            : (isFr ? 'Réservation de service direct' : 'Direct On-Demand Service Booking'));

      serviceTitle = terms.title && terms.title !== 'Professional Fixam Service' && terms.title !== 'Fixam Direct Booking'
        ? terms.title
        : (primarySkill
            ? (isFr ? `Service professionnel — ${primarySkill}` : `Professional ${primarySkill} Service`)
            : (bookingData.service || (isFr ? 'Prestation directe Fixam' : 'Fixam Direct Service Booking')));

      scopeDetails = terms.scopeOfWork && terms.scopeOfWork !== 'As specified in booking details.'
        ? terms.scopeOfWork
        : (bookingData.notes || (isFr ? 'Intervention directe convenue entre le client et le prestataire selon les compétences professionnelles du prestataire et les exigences du client.' : 'Direct on-demand service execution agreed between client and provider based on provider expertise and client specifications.'));
    }

    const scheduleDate = scheduleRaw.date || (bookingData.bookingDate ? new Date(bookingData.bookingDate).toLocaleDateString(isFr ? 'fr-FR' : 'en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' }) : (isFr ? 'Date convenue' : 'Agreed Date'));
    const scheduleTime = scheduleRaw.time || bookingData.bookingTime || (isFr ? 'Heure convenue' : 'Agreed Time');
    const scheduleDuration = scheduleRaw.duration || bookingData.bookingDuration || '1 - 2 Hours';
    const scheduleUrgency = scheduleRaw.urgency || bookingData.urgencyLevel || 'NORMAL';
    const jobLocation = terms.location || bookingData.location || (isFr ? 'Adresse désignée par le client' : 'Client Designated Address');

    const agreedPrice = Number(terms.price !== undefined ? terms.price : (bookingData.counterBudget || bookingData.budget || 0));
    const currency = terms.currency || 'XAF';
    const materials = Array.isArray(terms.materialsList) ? terms.materialsList : (Array.isArray(bookingData.materialsList) ? bookingData.materialsList : []);

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>${docNumber}</title>
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            color: #0F172A;
            background: #FFFFFF;
            padding: 30px;
            font-size: 12px;
            line-height: 1.5;
          }
          .header {
            background: #0D9488;
            color: #FFFFFF;
            padding: 24px;
            border-radius: 12px;
            margin-bottom: 24px;
          }
          .header h1 {
            font-size: 20px;
            font-weight: 800;
            letter-spacing: 0.5px;
            margin-bottom: 6px;
          }
          .header-meta {
            display: flex;
            justify-content: space-between;
            font-size: 11px;
            opacity: 0.95;
            margin-top: 10px;
            border-top: 1px solid rgba(255,255,255,0.25);
            padding-top: 8px;
          }
          .section {
            margin-bottom: 20px;
          }
          .section-title {
            font-size: 13px;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: #0F172A;
            margin-bottom: 8px;
            border-bottom: 2px solid #E2E8F0;
            padding-bottom: 4px;
          }
          .grid-2 {
            display: flex;
            gap: 16px;
          }
          .party-card {
            flex: 1;
            background: #F8FAFC;
            border: 1px solid #CBD5E1;
            border-radius: 10px;
            padding: 14px;
          }
          .party-role {
            font-size: 10px;
            font-weight: 800;
            text-transform: uppercase;
            color: #64748B;
            margin-bottom: 4px;
          }
          .party-name {
            font-size: 13px;
            font-weight: 700;
            color: #0D9488;
            margin-bottom: 4px;
          }
          .party-detail {
            font-size: 11px;
            color: #475569;
          }
          .info-box {
            background: #F8FAFC;
            border: 1px solid #CBD5E1;
            border-radius: 10px;
            padding: 14px;
          }
          .info-row {
            display: flex;
            margin-bottom: 6px;
            font-size: 11.5px;
          }
          .info-row:last-child { margin-bottom: 0; }
          .info-label {
            font-weight: 700;
            width: 140px;
            color: #334155;
          }
          .info-value {
            flex: 1;
            color: #0F172A;
          }
          .price-banner {
            background: #0D9488;
            color: #FFFFFF;
            padding: 12px 16px;
            border-radius: 8px;
            font-size: 13px;
            font-weight: 800;
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-top: 10px;
          }
          .clause-list {
            list-style: none;
            padding: 0;
          }
          .clause-list li {
            position: relative;
            padding-left: 14px;
            margin-bottom: 6px;
            font-size: 11px;
            color: #475569;
          }
          .clause-list li::before {
            content: "•";
            position: absolute;
            left: 0;
            color: #0D9488;
            font-weight: bold;
          }
          .acceptance-card {
            background: #ECFDF5;
            border: 1px solid #A7F3D0;
            border-radius: 10px;
            padding: 12px 16px;
          }
          .acceptance-title {
            font-size: 12px;
            font-weight: 800;
            color: #059669;
          }
          .acceptance-sub {
            font-size: 10.5px;
            color: #047857;
            margin-top: 2px;
          }
          .footer {
            margin-top: 24px;
            text-align: center;
            font-size: 10px;
            color: #94A3B8;
            border-top: 1px solid #E2E8F0;
            padding-top: 12px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${isFr ? 'CONTRAT DE SERVICE OFFICIEL FIXAM' : 'FIXAM OFFICIAL SERVICE AGREEMENT'}</h1>
          <div class="header-meta">
            <span><strong>${isFr ? 'Réf' : 'Ref'}:</strong> ${docNumber} (v${targetAgreement.version || 1})</span>
            <span><strong>${isFr ? 'Date' : 'Date'}:</strong> ${dateIssued}</span>
            <span><strong>${isFr ? 'Statut' : 'Status'}:</strong> ACTIVE & VERIFIED</span>
          </div>
        </div>

        <div class="section">
          <div class="section-title">${isFr ? '1. Parties Contractantes' : '1. Parties to this Agreement'}</div>
          <div class="grid-2">
            <div class="party-card">
              <div class="party-role">${isFr ? 'Client (Donneur d\'Ordre)' : 'Client (Ordering Party)'}</div>
              <div class="party-name">${clientName}</div>
              <div class="party-detail">ID: ${clientId}</div>
              <div class="party-detail">${isFr ? 'Tél' : 'Phone'}: ${clientPhone}</div>
              <div class="party-detail">Email: ${clientEmail}</div>
            </div>
            <div class="party-card">
              <div class="party-role">${isFr ? 'Prestataire de Service' : 'Service Provider'}</div>
              <div class="party-name">${providerName}</div>
              <div class="party-detail">ID: ${providerId}</div>
              <div class="party-detail">${isFr ? 'Tél' : 'Phone'}: ${providerPhone}</div>
              <div class="party-detail">Email: ${providerEmail}</div>
            </div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">${isFr ? '2. Service & Cahier des Charges' : '2. Service & Scope of Work'}</div>
          <div class="info-box">
            <div class="info-row">
              <div class="info-label">${isFr ? 'Service' : 'Service'}:</div>
              <div class="info-value" style="font-weight: 700; color: #0D9488;">${serviceTitle} (${serviceCategory})</div>
            </div>
            <div class="info-row">
              <div class="info-label">${isFr ? 'Description' : 'Scope Details'}:</div>
              <div class="info-value">${scopeDetails}</div>
            </div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">${isFr ? '3. Planning, Lieu & Rémunération' : '3. Schedule, Location & Pricing'}</div>
          <div class="info-box">
            <div class="info-row">
              <div class="info-label">${isFr ? 'Date & Heure' : 'Date & Time'}:</div>
              <div class="info-value">${scheduleDate} @ ${scheduleTime}</div>
            </div>
            <div class="info-row">
              <div class="info-label">${isFr ? 'Durée & Urgence' : 'Duration & Urgency'}:</div>
              <div class="info-value">${scheduleDuration} | Urgency: ${scheduleUrgency}</div>
            </div>
            <div class="info-row">
              <div class="info-label">${isFr ? 'Lieu' : 'Location'}:</div>
              <div class="info-value">${jobLocation}</div>
            </div>
            <div class="price-banner">
              <span>${isFr ? 'RÉMUNÉRATION TOTALE CONVENUE' : 'TOTAL AGREED COMPENSATION'}</span>
              <span>${agreedPrice.toLocaleString()} ${currency}</span>
            </div>
          </div>
        </div>

        ${materials.length > 0 ? `
        <div class="section">
          <div class="section-title">${isFr ? '4. Matériel & Outillage' : '4. Materials & Tools'}</div>
          <div class="info-box">
            ${materials.map(m => `
              <div class="info-row">
                <div class="info-label">• ${m.name || m.item} (x${m.quantity || m.qty || 1}):</div>
                <div class="info-value">${isFr ? 'Fourni par' : 'Supplied by'}: ${m.suppliedBy === 'CLIENT' ? 'Client' : 'Provider'}</div>
              </div>
            `).join('')}
          </div>
        </div>
        ` : ''}

        <div class="section">
          <div class="section-title">${isFr ? '5. Conditions & Règlement des Litiges' : '5. Obligations & Dispute Resolution'}</div>
          <ul class="clause-list">
            <li>${isFr ? 'Le client garantit un accès sécurisé et libre au lieu d\'intervention aux horaires convenus.' : 'Client agrees to provide safe and unhindered access to the premises at the agreed schedule.'}</li>
            <li>${isFr ? 'Le prestataire s\'engage à réaliser la mission avec diligence et professionnalisme.' : 'Provider agrees to perform services competently, professionally and in adherence to trade standards.'}</li>
            <li>${isFr ? 'Tout litige ou réclamation doit être soumis via le Centre de Litiges Fixam sous 72h.' : 'All disputes or claims must be submitted via the official Fixam Dispute Center within 72 hours.'}</li>
          </ul>
        </div>

        <div class="section">
          <div class="acceptance-card">
            <div class="acceptance-title">${isFr ? '✓ ACCORD NUMÉRIQUE MUTUEL ACTIF ET CONFORME' : '✓ MUTUAL ACTIVE DIGITAL CONTRACT CONFIRMED VIA FIXAM'}</div>
            <div class="acceptance-sub">${isFr ? 'Document certifié conforme faisant foi juridique entre les parties.' : 'Binding legal evidence record upon mutual confirmation on Fixam Marketplace.'}</div>
          </div>
        </div>

        <div class="footer">
          Fixam Technologies © ${new Date().getFullYear()} • Certified Electronic Service Record • Document ID: ${docNumber}
        </div>
      </body>
      </html>
    `;

    const Print = require('expo-print');
    const Sharing = require('expo-sharing');

    const { uri } = await Print.printToFileAsync({ html: htmlContent });

    await Sharing.shareAsync(uri, {
      mimeType: 'application/pdf',
      dialogTitle: `Fixam Contract - ${docNumber}`,
      UTI: 'com.adobe.pdf'
    });

    return true;
  } catch (error) {
    console.error('Error generating contract PDF:', error);
    Alert.alert('Error', 'Failed to generate contract PDF on device.');
    return false;
  }
}
