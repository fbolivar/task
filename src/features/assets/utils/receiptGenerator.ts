import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Asset } from '../types';

export const generateAssetReceipt = (asset: Asset) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const now = new Date().toLocaleDateString('es-CO');

    // --- Header ---
    doc.setFillColor(15, 23, 42); // Slate 900
    doc.rect(0, 0, pageWidth, 40, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.text('ACTA DE ENTREGA DE ACTIVO', 20, 25);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Fecha de Emisión: ${now}`, pageWidth - 20, 25, { align: 'right' });

    // --- Asset Info Section ---
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('I. INFORMACIÓN DEL ACTIVO', 20, 55);

    autoTable(doc, {
        startY: 60,
        head: [['Concepto', 'Detalle']],
        body: [
            ['Nombre del Activo', asset.name],
            ['Categoría', asset.category],
            ['Número de Serial / Placa', asset.serial_number || 'N/A'],
            ['Ubicación Asignada', asset.location || 'N/A'],
            ['Entidad Propietaria', asset.entity?.name || 'Sistema Global'],
            ['Estado en Entrega', asset.status]
        ],
        theme: 'striped',
        headStyles: { fillColor: [59, 130, 246] }, // Primary Blue
        styles: { fontSize: 10, cellPadding: 5 }
    });

    // --- Assignee Info ---
    const finalY = (doc as any).lastAutoTable.finalY + 15;
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('II. RESPONSABLE DE ASIGNACIÓN', 20, finalY);

    autoTable(doc, {
        startY: finalY + 5,
        head: [['Campo', 'Información del Funcionario']],
        body: [
            ['Funcionario Responsable', asset.assignee?.full_name || 'PENDIENTE DE ASIGNACIÓN'],
            ['Rol/Cargo', 'Personal Vinculado'],
            ['Fecha de Asignación', asset.purchase_date || now]
        ],
        theme: 'grid',
        headStyles: { fillColor: [71, 85, 105] }, // Slate 600
        styles: { fontSize: 10, cellPadding: 5 }
    });

    // --- Terms and Conditions ---
    const termsY = (doc as any).lastAutoTable.finalY + 15;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('III. COMPROMISOS Y RESPONSABILIDADES', 20, termsY);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    const terms = [
        '1. El funcionario se compromete a dar un uso adecuado y exclusivamente profesional al activo entregado.',
        '2. Cualquier daño derivado del mal uso o negligencia será responsabilidad del funcionario.',
        '3. En caso de pérdida o robo, se debe informar inmediatamente al departamento de IT/Administración.',
        '4. El activo debe ser devuelto en las mismas condiciones que se entrega, salvo el desgaste natural.'
    ];
    doc.text(terms, 20, termsY + 8);

    // --- Signatures ---
    const sigY = doc.internal.pageSize.height - 40;

    doc.setDrawColor(15, 23, 42);
    doc.line(20, sigY, 90, sigY);
    doc.text('Entregado por (Firma y Sello)', 20, sigY + 5);

    doc.line(pageWidth - 90, sigY, pageWidth - 20, sigY);
    doc.text('Recibido conforme (Funcionario)', pageWidth - 20, sigY + 5, { align: 'right' });

    // --- Footer ---
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(`Identificador de Auditoría: ${asset.id.split('-')[0].toUpperCase()}`, 20, doc.internal.pageSize.height - 10);
    doc.text('Documento generado por BC FABRIC SAS - Sistema de Gestión de Activos V3', pageWidth / 2, doc.internal.pageSize.height - 10, { align: 'center' });

    doc.save(`Acta_Entrega_${asset.name.replace(/\s+/g, '_')}.pdf`);
};
