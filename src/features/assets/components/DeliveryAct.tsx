import { Asset } from '../types';
import { Document, Page, Text, View, StyleSheet, PDFDownloadLink, Image } from '@react-pdf/renderer';
import { FileText } from 'lucide-react';

// Define styles for PDF
const styles = StyleSheet.create({
    page: {
        padding: 40,
        fontFamily: 'Helvetica',
        fontSize: 11,
        lineHeight: 1.5,
    },
    header: {
        marginBottom: 20,
        textAlign: 'center',
        borderBottom: 1,
        borderBottomColor: '#ccc',
        paddingBottom: 10,
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 4,
        textTransform: 'uppercase',
    },
    subtitle: {
        fontSize: 12,
        color: '#666',
        marginBottom: 20,
    },
    section: {
        marginBottom: 15,
    },
    sectionTitle: {
        fontSize: 12,
        fontWeight: 'bold',
        marginTop: 10,
        marginBottom: 5,
        backgroundColor: '#f0f0f0',
        padding: 4,
    },
    row: {
        flexDirection: 'row',
        marginBottom: 4,
    },
    label: {
        width: 120,
        fontWeight: 'bold',
        color: '#444',
    },
    value: {
        flex: 1,
    },
    legalText: {
        marginTop: 20,
        marginBottom: 40,
        fontSize: 10,
        textAlign: 'justify',
    },
    signatures: {
        marginTop: 50,
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    signatureBlock: {
        width: '45%',
        borderTop: 1,
        borderTopColor: '#000',
        paddingTop: 10,
        alignItems: 'center',
    },
    footer: {
        position: 'absolute',
        bottom: 30,
        left: 40,
        right: 40,
        fontSize: 8,
        textAlign: 'center',
        color: '#999',
        borderTop: 1,
        borderTopColor: '#eee',
        paddingTop: 10,
    }
});

interface DeliveryActProps {
    asset: Asset;
    companyName?: string;
}

const ActDocument = ({ asset, companyName = 'BC FABRIC SAS' }: DeliveryActProps) => (
    <Document>
        <Page size="LETTER" style={styles.page}>
            <View style={styles.header}>
                <Text style={styles.title}>ACTA DE ENTREGA DE ACTIVOS</Text>
                <Text style={styles.subtitle}>{companyName} - Control de Inventario</Text>
                <Text style={{ fontSize: 10, marginTop: 5 }}>
                    Fecha: {new Date().toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' })}
                </Text>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>1. INFORMACIÓN DEL ACTIVO</Text>
                <View style={styles.row}>
                    <Text style={styles.label}>Nombre:</Text>
                    <Text style={styles.value}>{asset.name}</Text>
                </View>
                <View style={styles.row}>
                    <Text style={styles.label}>Serial/Código:</Text>
                    <Text style={styles.value}>{asset.serial_number || 'N/A'}</Text>
                </View>
                <View style={styles.row}>
                    <Text style={styles.label}>Categoría:</Text>
                    <Text style={styles.value}>{asset.category}</Text>
                </View>
                <View style={styles.row}>
                    <Text style={styles.label}>Estado:</Text>
                    <Text style={styles.value}>{asset.status}</Text>
                </View>
                <View style={styles.row}>
                    <Text style={styles.label}>Valor:</Text>
                    <Text style={styles.value}>
                        {asset.purchase_value
                            ? new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(asset.purchase_value)
                            : 'N/A'}
                    </Text>
                </View>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>2. ASIGNACIÓN</Text>
                <View style={styles.row}>
                    <Text style={styles.label}>Responsable:</Text>
                    <Text style={styles.value}>{asset.assignee?.full_name || 'Sin Asignar'}</Text>
                </View>
                <View style={styles.row}>
                    <Text style={styles.label}>Entidad:</Text>
                    <Text style={styles.value}>{asset.entity?.name || 'N/A'}</Text>
                </View>
                <View style={styles.row}>
                    <Text style={styles.label}>Ubicación:</Text>
                    <Text style={styles.value}>{asset.location || 'N/A'}</Text>
                </View>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>3. GARANTÍA Y VIDA ÚTIL</Text>
                <View style={styles.row}>
                    <Text style={styles.label}>Vencimiento Garantía:</Text>
                    <Text style={styles.value}>
                        {asset.warranty_expiration
                            ? new Date(asset.warranty_expiration).toLocaleDateString()
                            : 'N/A'}
                    </Text>
                </View>
                <View style={styles.row}>
                    <Text style={styles.label}>Vida Útil Estimada:</Text>
                    <Text style={styles.value}>{asset.useful_life_years} años</Text>
                </View>
            </View>

            <View style={styles.section}>
                <Text style={styles.legalText}>
                    Por medio del presente documento, el Responsable declara recibir el activo descrito en perfectas condiciones de funcionamiento (salvo las observaciones anotadas) y se compromete a:
                    {'\n\n'}
                    1. Darle el uso adecuado y exclusivo para actividades laborales.
                    {'\n'}
                    2. Custodiarlo y protegerlo contra daños o pérdidas.
                    {'\n'}
                    3. Reportar inmediatamente cualquier falla, daño o pérdida al departamento administrativo.
                    {'\n'}
                    4. Devolver el activo en las mismas condiciones al finalizar su vínculo laboral o cuando sea requerido.
                </Text>
            </View>

            <View style={styles.signatures}>
                <View style={styles.signatureBlock}>
                    <Text>ENTREGA</Text>
                    <Text style={{ marginTop: 30, fontSize: 9 }}>Administrativo / Inventario</Text>
                    <Text style={{ fontSize: 8, color: '#666' }}>{companyName}</Text>
                </View>
                <View style={styles.signatureBlock}>
                    <Text>RECIBE</Text>
                    <Text style={{ marginTop: 30, fontSize: 9 }}>{asset.assignee?.full_name || 'Firma Responsable'}</Text>
                    <Text style={{ fontSize: 8, color: '#666' }}>C.C. ____________________</Text>
                </View>
            </View>

            <Text style={styles.footer}>
                Generado automáticamente por el Sistema de Gestión {companyName} • {new Date().toISOString()}
            </Text>
        </Page>
    </Document>
);

export function DeliveryActButton({ asset }: { asset: Asset }) {
    if (!asset.assigned_to) return null;

    return (
        <PDFDownloadLink
            document={<ActDocument asset={asset} />}
            fileName={`Acta_Entrega_${asset.serial_number || asset.id}.pdf`}
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-bold uppercase transition-colors"
        >
            {({ loading }: { loading: boolean }) => (
                <>
                    <FileText className="w-4 h-4" />
                    {loading ? 'Generando...' : 'Descargar Acta'}
                </>
            )}
        </PDFDownloadLink>
    );
}
