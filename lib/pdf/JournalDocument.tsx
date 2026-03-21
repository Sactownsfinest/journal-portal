import {
  Document,
  Page as PDFPage,
  View,
  Text,
  Image,
  StyleSheet,
  Line,
  Svg,
} from '@react-pdf/renderer'
import type { Page } from '@/types'

// A5 + 3mm bleed on each side: 154mm × 216mm
const PAGE_WIDTH_MM = 154
const PAGE_HEIGHT_MM = 216
const BLEED_MM = 3

const styles = StyleSheet.create({
  page: {
    width: `${PAGE_WIDTH_MM}mm`,
    height: `${PAGE_HEIGHT_MM}mm`,
    backgroundColor: '#fdf8f0',
    fontFamily: 'Times-Roman',
    position: 'relative',
  },
  fullImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  coverText: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'column',
    paddingHorizontal: 24,
  },
  coverTitle: {
    fontSize: 22,
    color: '#ffffff',
    textAlign: 'center',
    fontFamily: 'Times-Bold',
    marginBottom: 6,
  },
  coverSubtitle: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    letterSpacing: 2,
  },
  body: {
    padding: `${BLEED_MM + 8}mm`,
  },
  promptText: {
    fontSize: 10,
    color: '#3a2e1a',
    fontStyle: 'italic',
    marginBottom: 14,
    lineHeight: 1.6,
  },
  line: {
    borderBottom: '0.5pt solid #c8b89a',
    marginBottom: 12,
  },
  textImageContainer: {
    flexDirection: 'row',
    width: '100%',
    height: '100%',
  },
  textBlock: {
    flex: 1,
    padding: `${BLEED_MM + 6}mm`,
  },
  bodyText: {
    fontSize: 9,
    color: '#3a2e1a',
    lineHeight: 1.8,
  },
  pageNumber: {
    position: 'absolute',
    bottom: `${BLEED_MM + 4}mm`,
    left: 0,
    right: 0,
    textAlign: 'center',
    fontSize: 7,
    color: '#c8b89a',
  },
  cropMark: {
    position: 'absolute',
    stroke: '#000000',
    strokeWidth: 0.25,
  },
})

function CropMarks() {
  const b = BLEED_MM
  const markLen = 4
  const offset = 1

  // Corner positions in mm (rendered as pt in @react-pdf/renderer: 1mm ≈ 2.835pt)
  const w = PAGE_WIDTH_MM
  const h = PAGE_HEIGHT_MM

  return (
    <Svg style={{ position: 'absolute', top: 0, left: 0, width: `${w}mm`, height: `${h}mm` }}>
      {/* Top-left */}
      <Line x1={`${b - offset - markLen}mm`} y1={`${b}mm`} x2={`${b - offset}mm`} y2={`${b}mm`} stroke="#000" strokeWidth={0.5} />
      <Line x1={`${b}mm`} y1={`${b - offset - markLen}mm`} x2={`${b}mm`} y2={`${b - offset}mm`} stroke="#000" strokeWidth={0.5} />
      {/* Top-right */}
      <Line x1={`${w - b + offset}mm`} y1={`${b}mm`} x2={`${w - b + offset + markLen}mm`} y2={`${b}mm`} stroke="#000" strokeWidth={0.5} />
      <Line x1={`${w - b}mm`} y1={`${b - offset - markLen}mm`} x2={`${w - b}mm`} y2={`${b - offset}mm`} stroke="#000" strokeWidth={0.5} />
      {/* Bottom-left */}
      <Line x1={`${b - offset - markLen}mm`} y1={`${h - b}mm`} x2={`${b - offset}mm`} y2={`${h - b}mm`} stroke="#000" strokeWidth={0.5} />
      <Line x1={`${b}mm`} y1={`${h - b + offset}mm`} x2={`${b}mm`} y2={`${h - b + offset + markLen}mm`} stroke="#000" strokeWidth={0.5} />
      {/* Bottom-right */}
      <Line x1={`${w - b + offset}mm`} y1={`${h - b}mm`} x2={`${w - b + offset + markLen}mm`} y2={`${h - b}mm`} stroke="#000" strokeWidth={0.5} />
      <Line x1={`${w - b}mm`} y1={`${h - b + offset}mm`} x2={`${w - b}mm`} y2={`${h - b + offset + markLen}mm`} stroke="#000" strokeWidth={0.5} />
    </Svg>
  )
}

function JournalPage({ page, pageNumber }: { page: Page; pageNumber: number }) {
  const c = page.content

  return (
    <PDFPage size={[`${PAGE_WIDTH_MM}mm`, `${PAGE_HEIGHT_MM}mm`] as any} style={styles.page}>
      {page.template_type === 'cover' && (
        <>
          {c.image_url && <Image src={c.image_url} style={styles.fullImage} />}
          <View style={styles.overlay} />
          <View style={styles.coverText}>
            {c.title_text && <Text style={styles.coverTitle}>{c.title_text}</Text>}
            {c.subtitle_text && <Text style={styles.coverSubtitle}>{c.subtitle_text.toUpperCase()}</Text>}
          </View>
        </>
      )}

      {page.template_type === 'full_image' && c.image_url && (
        <Image src={c.image_url} style={styles.fullImage} />
      )}

      {page.template_type === 'text_image' && (
        <View style={styles.textImageContainer}>
          {c.image_side !== 'right' && c.image_url && (
            <Image src={c.image_url} style={{ width: '40%', height: '100%', objectFit: 'cover' }} />
          )}
          <View style={styles.textBlock}>
            {c.body_text && <Text style={styles.bodyText}>{c.body_text}</Text>}
          </View>
          {c.image_side === 'right' && c.image_url && (
            <Image src={c.image_url} style={{ width: '40%', height: '100%', objectFit: 'cover' }} />
          )}
        </View>
      )}

      {page.template_type === 'prompt_lines' && (
        <View style={styles.body}>
          {c.prompt_text && <Text style={styles.promptText}>{c.prompt_text}</Text>}
          {Array.from({ length: c.lines_count ?? 15 }).map((_, i) => (
            <View key={i} style={styles.line} />
          ))}
        </View>
      )}

      {/* Page number */}
      <Text style={styles.pageNumber}>{pageNumber}</Text>

      {/* Crop marks */}
      <CropMarks />
    </PDFPage>
  )
}

export default function JournalDocument({ pages, title }: { pages: Page[]; title: string }) {
  return (
    <Document title={title} author="Journal Portal" creator="Journal Portal">
      {pages.map((page, idx) => (
        <JournalPage key={page.id} page={page} pageNumber={idx + 1} />
      ))}
    </Document>
  )
}
