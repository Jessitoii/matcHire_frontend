"use client"

import { useRef } from "react"
import "@ungap/with-resolvers"

type CVItem = { name: string; text: string }

/**
 * CVUploader
 * - Client-only component
 * - Accepts only PDF files
 * - Extracts text from each PDF using a dynamic import of PDF.js legacy build
 *   and disables workers (recommended for single-file client extraction in Next.js)
 * - Safely handles multiple concurrent uploads and appends parsed CVs to `cvs`
 */
export default function CVUploader({
  cvs,
  setCvs,
}: {
  cvs: CVItem[]
  setCvs: (c: CVItem[]) => void
}) {
  const fileRef = useRef<HTMLInputElement | null>(null)

  async function extractTextFromPDF(file: File): Promise<string> {
    // 1. Kütüphaneyi dinamik import et
    // @ts-ignore
    const pdfjs: any = await import('pdfjs-dist/legacy/build/pdf');

    // 2. !!! ÇÖZÜM BURADA !!!
    // Worker'ın yolunu 'public' klasöründeki kopyaladığın dosya olarak ayarla.
    // Next.js, 'public' klasöründeki her şeyi ana dizin '/' altında sunar.
    pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.js';

    // Read the file into an ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();

    // 3. 'disableWorker: true' seçeneğini KALDIR.
    // Artık worker'ı doğru yüklediğimize göre, bırakalım kullansın.
    // Bu, PDF ayrıştırma işlemi sırasında UI'ın donmasını engeller.
    const loadingTask = pdfjs.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;

    try {
      const maxPages = pdf.numPages;
      const pageTextPromises: Promise<string>[] = [];

      for (let pageNum = 1; pageNum <= maxPages; pageNum++) {
        pageTextPromises.push(
          pdf.getPage(pageNum).then(async (page: any) => {
            const content = await page.getTextContent();
            // content.items may contain transform info; item.str is the text
            const strings = content.items.map((item: any) => (item.str ? item.str : ''));
            return strings.join(' ');
          })
        );
      }

      const pageTexts = await Promise.all(pageTextPromises);
      return pageTexts.join('\n').trim();
    } finally {
      // Clean up PDF document to release memory
      try { pdf.destroy(); } catch (e) { /* ignore */ }
    }
  }

  async function handleFiles(files: FileList | null) {
    if (!files) return

    const fileArray = Array.from(files)
    // Filter to PDFs only
    const pdfFiles = fileArray.filter((f) => f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf'))
    if (pdfFiles.length === 0) return

    // Parse all PDFs in parallel
    const parsed = await Promise.all(
      pdfFiles.map(async (f) => {
        try {
          const text = await extractTextFromPDF(f)
          return { name: f.name, text }
        } catch (err: any) {
          // On failure, return an item with empty text and include error message
          console.error('Failed to parse PDF', f.name, err)
          return { name: f.name, text: `<<failed to extract text: ${err?.message ?? err}>>` }
        }
      })
    )
    // @ts-ignore
    setCvs((prev) => [...prev, ...parsed])
    // Reset file input so the same files can be re-selected if needed
    if (fileRef.current) fileRef.current.value = ''
  }

  return (
    <div>
      <div className="mb-2">
        <label className="block text-sm font-medium">Upload PDF CV files</label>
        <input
          ref={fileRef}
          type="file"
          accept="application/pdf,.pdf"
          multiple
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleFiles(e.target.files)}
          className="mt-1"
        />
      </div>

      <div className="mt-3">
        <h4 className="text-sm font-medium">Uploaded CVs</h4>
        <ul className="mt-2 space-y-2">
          {cvs.map((c, i) => (
            <li key={i} className="flex items-center justify-between bg-gray-50 p-2 rounded">
              <div>
                <div className="font-medium">{c.name}</div>
                <div className="text-xs text-slate-600 truncate max-w-sm">{c.text.slice(0, 120)}</div>
              </div>
              <div>
                <button onClick={() => setCvs(cvs.filter((_, idx) => idx !== i))} className="text-sm text-red-600">
                  Remove
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

