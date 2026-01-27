import { Asset } from '../types';
import { Document, Page, Text, View, StyleSheet, PDFDownloadLink, Image } from '@react-pdf/renderer';
import { FileText } from 'lucide-react';

// Define styles for PDF
const styles = StyleSheet.create({
    page: {
        padding: 40,
        fontFamily: 'Helvetica',
        fontSize: 10,
        lineHeight: 1.5,
        backgroundColor: '#fff'
    },
    header: {
        marginBottom: 20,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: 2,
        borderBottomColor: '#2F855A', // PNN Green
        paddingBottom: 15,
    },
    headerText: {
        flex: 1,
    },
    title: {
        fontSize: 16,
        fontWeight: 'bold',
        textTransform: 'uppercase',
        color: '#2F855A',
    },
    subtitle: {
        fontSize: 10,
        color: '#444',
        marginTop: 4,
    },
    section: {
        marginBottom: 15,
        padding: 10,
        backgroundColor: '#f8f9fa',
        borderRadius: 4,
    },
    sectionTitle: {
        fontSize: 11,
        fontWeight: 'bold',
        marginBottom: 8,
        color: '#1a202c',
        borderBottom: 1,
        borderBottomColor: '#e2e8f0',
        paddingBottom: 4,
    },
    row: {
        flexDirection: 'row',
        marginBottom: 6,
    },
    label: {
        width: 140,
        fontWeight: 'bold',
        color: '#4a5568',
        fontSize: 9,
    },
    value: {
        flex: 1,
        color: '#2d3748',
        fontSize: 9,
    },
    legalText: {
        marginTop: 10,
        marginBottom: 20,
        fontSize: 9,
        textAlign: 'justify',
        color: '#4a5568',
        lineHeight: 1.6,
    },
    signatures: {
        marginTop: 40,
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingTop: 20,
    },
    signatureBlock: {
        width: '45%',
        alignItems: 'center',
    },
    signLine: {
        width: '100%',
        borderTop: 1,
        borderTopColor: '#2d3748',
        marginBottom: 8,
    },
    signLabel: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#2d3748',
    },
    signSubLabel: {
        fontSize: 8,
        color: '#718096',
        marginTop: 2,
    },
    footer: {
        position: 'absolute',
        bottom: 30,
        left: 40,
        right: 40,
        fontSize: 8,
        textAlign: 'center',
        color: '#a0aec0',
        borderTop: 1,
        borderTopColor: '#edf2f7',
        paddingTop: 10,
    }
});

interface DeliveryActProps {
    asset: Asset;
    companyName?: string;
}

const ActDocument = ({ asset, companyName = 'Parques Nacionales Naturales de Colombia' }: DeliveryActProps) => (
    <Document>
        <Page size="LETTER" style={styles.page}>
            <View style={styles.header}>
                <View style={styles.headerText}>
                    <Text style={styles.title}>Acta de Entrega de Activos</Text>
                    <Text style={styles.subtitle}>{companyName}</Text>
                    <Text style={{ fontSize: 9, marginTop: 4, color: '#666' }}>Sistema de Gestión de Inventarios</Text>
                </View>
                <View>
                    <Text style={{ fontSize: 9, color: '#666' }}>
                        Fecha: {new Date().toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </Text>
                </View>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>1. INFORMACIÓN DEL ACTIVO</Text>
                <View style={styles.row}>
                    <Text style={styles.label}>Nombre del Bien:</Text>
                    <Text style={styles.value}>{asset.name}</Text>
                </View>
                <View style={styles.row}>
                    <Text style={styles.label}>Serial / Placa:</Text>
                    <Text style={styles.value}>{asset.serial_number || 'N/A'}</Text>
                </View>
                <View style={styles.row}>
                    <Text style={styles.label}>Categoría:</Text>
                    <Text style={styles.value}>{asset.category}</Text>
                </View>
                <View style={styles.row}>
                    <Text style={styles.label}>Estado Actual:</Text>
                    <Text style={styles.value}>{asset.status}</Text>
                </View>
                <View style={styles.row}>
                    <Text style={styles.label}>Valor Registrado:</Text>
                    <Text style={styles.value}>
                        {asset.purchase_value
                            ? new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(asset.purchase_value)
                            : 'N/A'}
                    </Text>
                </View>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>2. DATOS DE ASIGNACIÓN</Text>
                <View style={styles.row}>
                    <Text style={styles.label}>Funcionario Responsable:</Text>
                    <Text style={styles.value}>{asset.assignee?.full_name || 'Sin Asignar'}</Text>
                </View>
                <View style={styles.row}>
                    <Text style={styles.label}>Entidad / Área:</Text>
                    <Text style={styles.value}>{asset.entity?.name || 'N/A'}</Text>
                </View>
                <View style={styles.row}>
                    <Text style={styles.label}>Ubicación Física:</Text>
                    <Text style={styles.value}>{asset.location || 'N/A'}</Text>
                </View>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>3. DETALLES TÉCNICOS</Text>
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

            <View style={{ marginTop: 10, padding: 10 }}>
                <Text style={{ fontSize: 10, fontWeight: 'bold', marginBottom: 5 }}>DECLARACIÓN DE RESPONSABILIDAD</Text>
                <Text style={styles.legalText}>
                    El funcionario responsable declara recibir el activo descrito anteriormente en las condiciones estipuladas. Se compromete a custodiarlo, utilizarlo exclusivamente para el cumplimiento de sus funciones laborales y a devolverlo en el mismo estado de conservación (salvo el deterioro normal por uso) al finalizar la asignación o su vinculación con la entidad. Cualquier pérdida o daño injustificado será responsabilidad del funcionario.
                </Text>
            </View>

            <View style={styles.signatures}>
                <View style={styles.signatureBlock}>
                    <View style={styles.signLine} />
                    <Text style={styles.signLabel}>QUIEN ENTREGA</Text>
                    <Text style={styles.signSubLabel}>Almacén / Inventarios</Text>
                    <Text style={styles.signSubLabel}>{companyName}</Text>
                </View>
                <View style={styles.signatureBlock}>
                    <View style={styles.signLine} />
                    <Text style={styles.signLabel}>QUIEN RECIBE</Text>
                    <Text style={styles.signSubLabel}>{asset.assignee?.full_name || 'Funcionario Responsable'}</Text>
                    <Text style={styles.signSubLabel}>C.C.</Text>
                </View>
            </View>

            <Text style={styles.footer}>
                Documento generado automáticamente • {companyName} • {new Date().toISOString()} • Control ID: {asset.id.slice(0, 8)}
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
