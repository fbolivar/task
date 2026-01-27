import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ChangeRequest } from '../types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const getBase64ImageFromURL = (url: string): Promise<string> => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.setAttribute('crossOrigin', 'anonymous');
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            ctx?.drawImage(img, 0, 0);
            const dataURL = canvas.toDataURL('image/png');
            resolve(dataURL);
        };
        img.onerror = (error) => reject(error);
        img.src = url;
    });
};

export const generateChangeRequestPDF = async (cr: ChangeRequest): Promise<string> => {
    const doc = new jsPDF() as any;
    const pageWidth = doc.internal.pageSize.width;

    // --- Header ---
    doc.setFillColor(3, 166, 74); // official PNN Green (#03A64A)
    doc.rect(0, 0, pageWidth, 35, 'F');

    // Attempt to add Entity Logo
    const logoUrl = cr.project?.entity?.logo_url;
    if (logoUrl) {
        try {
            const base64Logo = await getBase64ImageFromURL(logoUrl);
            const imgProps = doc.getImageProperties(base64Logo);
            const ratio = imgProps.width / imgProps.height;
            const maxWidth = 25;
            const maxHeight = 25;
            let newWidth = maxWidth;
            let newHeight = newWidth / ratio;
            if (newHeight > maxHeight) {
                newHeight = maxHeight;
                newWidth = newHeight * ratio;
            }
            // Center it in the 25x25 box within the header
            const xOffset = (maxWidth - newWidth) / 2;
            const yOffset = (maxHeight - newHeight) / 2;
            doc.addImage(base64Logo, 'PNG', 12 + xOffset, 5 + yOffset, newWidth, newHeight);
        } catch (e) {
            console.error('Could not load entity logo for PDF', e);
        }
    }

    const textX = logoUrl ? 42 : 15;

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22); // Larger title
    doc.setFont('helvetica', 'bold');
    doc.text('REPORTE DE CAMBIO AUTORIZADO', textX, 18);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    if (cr.project?.entity?.name) {
        doc.text(cr.project.entity.name.toUpperCase(), textX, 26);
    }

    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    // Lowered position for CÓDIGO (near bottom of header)
    doc.text(`CÓDIGO: ${cr.code}`, pageWidth - 15, 30, { align: 'right' });

    // --- General Information ---
    doc.setDrawColor(4, 156, 217); // Blue accent
    doc.setTextColor(4, 156, 217); // Blue for header
    doc.setFontSize(14);
    doc.text('Información General', 15, 48);
    doc.line(15, 50, pageWidth - 15, 50);

    const generalData = [
        ['Título', cr.title],
        ['Proyecto', cr.project?.name || 'N/A'],
        ['Entidad', cr.project?.entity?.name || 'N/A'],
        ['Solicitante', cr.requester?.full_name || 'N/A'],
        ['Tipo de Cambio', cr.change_type || 'N/A'],
        ['Prioridad', cr.priority || 'N/A'],
        ['Estado', cr.status.toUpperCase()],
        ['Fecha Creación', format(new Date(cr.created_at), 'PPP', { locale: es })],
    ];

    autoTable(doc, {
        startY: 53,
        body: generalData,
        theme: 'plain',
        styles: { fontSize: 10, cellPadding: 2 },
        columnStyles: { 0: { fontStyle: 'bold', cellWidth: 40 } }
    });

    let currentY = (doc as any).lastAutoTable.finalY + 10;

    // --- Description & Scope ---
    doc.setTextColor(4, 156, 217);
    doc.setFontSize(14);
    doc.text('Descripción y Alcance', 15, currentY);
    doc.line(15, currentY + 2, pageWidth - 15, currentY + 2);

    doc.setTextColor(51, 65, 85); // Reset to dark slate for body text

    // Using a table for Description and Justification for better flow and page breaks
    const descData = [
        ['Descripción', cr.description || 'Sin descripción proporcionada'],
        ['Justificación', cr.justification || 'Sin justificación proporcionada'],
        ['Alcance', cr.scope || 'N/A']
    ];

    autoTable(doc, {
        startY: currentY + 5,
        body: descData,
        theme: 'striped',
        styles: { fontSize: 10, cellPadding: 3 },
        columnStyles: { 0: { fontStyle: 'bold', cellWidth: 40, textColor: [4, 156, 217] } }
    });

    currentY = (doc as any).lastAutoTable.finalY + 10;

    // --- Plan de Trabajo ---
    if (cr.plans && cr.plans.length > 0) {
        currentY += 5;
        doc.setTextColor(4, 156, 217);
        doc.setFontSize(14);
        doc.text('Plan de Implementación', 15, currentY);
        autoTable(doc, {
            startY: currentY + 5,
            head: [['Fase', 'Actividad', 'Responsable']],
            body: cr.plans.map(p => [p.phase, p.activity, (p as any).responsible?.full_name || p.responsible_id || 'N/A']),
            headStyles: { fillColor: [4, 156, 217] } // official PNN Blue (#049DD9)
        });
        currentY = (doc as any).lastAutoTable.finalY + 10;
    }

    // --- Auditoría de Aprobación ---
    if (currentY > 230) {
        doc.addPage();
        currentY = 20;
    }

    doc.setFillColor(241, 245, 249);
    doc.rect(15, currentY, pageWidth - 30, 40, 'F');

    doc.setTextColor(15, 23, 42);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('AUDITORÍA DE APROBACIÓN', 20, currentY + 10);

    doc.setFontSize(10);
    doc.text('Autorizado por:', 20, currentY + 20);
    doc.setFont('helvetica', 'normal');
    doc.text(cr.approver?.full_name || 'Sistema', 20, currentY + 26);

    // Audit Code Implementation
    const auditCode = (cr.id.split('-')[0] + (cr.approval_date ? new Date(cr.approval_date).getTime().toString(36) : '')).toUpperCase().substring(0, 12);
    doc.setFont('helvetica', 'bold');
    doc.text('Código de Auditoría:', pageWidth - 80, currentY + 20);
    doc.setFont('helvetica', 'normal');
    doc.text(auditCode, pageWidth - 80, currentY + 26);

    doc.setFont('helvetica', 'bold');
    doc.text('Fecha de Resolución:', 20, currentY + 34);
    doc.setFont('helvetica', 'normal');
    doc.text(cr.approval_date ? format(new Date(cr.approval_date), 'PPP HH:mm', { locale: es }) : 'N/A', 62, currentY + 34);

    // --- Footer ---
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(148, 163, 184);
        doc.text(`GesPro Change Management System - Página ${i} de ${pageCount}`, pageWidth / 2, doc.internal.pageSize.height - 10, { align: 'center' });
    }

    // Return as base64
    const pdfOutput = doc.output('datauristring');
    // We only want the base64 part for nodemailer
    return pdfOutput.split(',')[1];
};
