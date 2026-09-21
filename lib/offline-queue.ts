import { z } from "zod"
import { reportSchema } from "@/lib/validation"

const databaseName = "baha-tracker"
const storeName = "pending-reports"

const openDatabase = () => new Promise<IDBDatabase>((resolve, reject) => {
  const request = indexedDB.open(databaseName, 1)
  request.onupgradeneeded = () => request.result.createObjectStore(storeName, { keyPath: "queueId" })
  request.onsuccess = () => resolve(request.result)
  request.onerror = () => reject(request.error)
})

export const enqueueReport = async (report: z.infer<typeof reportSchema>) => {
  const database = await openDatabase()
  const transaction = database.transaction(storeName, "readwrite")
  transaction.objectStore(storeName).put({ ...report, queueId: crypto.randomUUID(), queuedAt: new Date().toISOString() })
  await new Promise<void>((resolve, reject) => {
    transaction.oncomplete = () => resolve()
    transaction.onerror = () => reject(transaction.error)
  })
}

export const syncQueuedReports = async () => {
  const database = await openDatabase()
  const items = await new Promise<Array<z.infer<typeof reportSchema> & { queueId: string }>>((resolve, reject) => {
    const request = database.transaction(storeName, "readonly").objectStore(storeName).getAll()
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
  for (const item of items) {
    const response = await fetch("/api/reports", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(item) })
    if (response.ok) {
      const transaction = database.transaction(storeName, "readwrite")
      transaction.objectStore(storeName).delete(item.queueId)
    }
  }
  return items.length
}
