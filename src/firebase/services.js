import { db } from './config'
import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  serverTimestamp, 
  doc, 
  updateDoc 
} from 'firebase/firestore'

// Generate a unique job ID like "SVC-2026-001"
export const generateJobId = async () => {
  const today = new Date()
  const year = today.getFullYear()
  
  const jobsRef = collection(db, 'service_jobs')
  const q = query(jobsRef, where('checkin_date', '>=', new Date(year, 0, 1)))
  const snapshot = await getDocs(q)
  const count = snapshot.size + 1
  
  return `SVC-${year}-${String(count).padStart(3, '0')}`
}

// Save a new job to Firestore
export const createJob = async (jobData) => {
  try {
    const jobId = await generateJobId()
    
    const newJob = {
      ...jobData,
      job_id: jobId,
      checkin_date: serverTimestamp(),
      status: 'Received',
      spare_replaced: '',
      service_cost: 0,
      customer_intimated: false,
      payment_method: '',
      amount_paid: 0,
      checkout_date: null,
    }
    
    const docRef = await addDoc(collection(db, 'service_jobs'), newJob)
    return { success: true, jobId, docId: docRef.id }
  } catch (error) {
    console.error('Error creating job:', error)
    return { success: false, error: error.message }
  }
}

// Get all jobs
export const getAllJobs = async () => {
  try {
    const snapshot = await getDocs(
      query(collection(db, 'service_jobs'), orderBy('checkin_date', 'desc'))
    )
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
  } catch (error) {
    console.error('Error fetching jobs:', error)
    return []
  }
}

// Get jobs by customer phone
export const getJobsByPhone = async (phone) => {
  try {
    const snapshot = await getDocs(
      query(collection(db, 'service_jobs'), where('contact_number', '==', phone))
    )
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
  } catch (error) {
    console.error('Error fetching jobs:', error)
    return []
  }
}

// Update service job details
export const updateJob = async (jobId, updateData) => {
  try {
    const jobRef = doc(db, 'service_jobs', jobId)
    await updateDoc(jobRef, {
      ...updateData,
      status: 'Notified'
    })
    return { success: true }
  } catch (error) {
    console.error('Error updating job:', error)
    return { success: false, error: error.message }
  }
}

// Checkout and record payment for service job
export const checkoutJob = async (jobId, paymentData) => {
  try {
    const jobRef = doc(db, 'service_jobs', jobId)
    await updateDoc(jobRef, {
      payment_method: paymentData.payment_method,
      amount_paid: parseFloat(paymentData.amount_paid),
      checkout_date: serverTimestamp(),
      status: 'Completed'
    })
    return { success: true }
  } catch (error) {
    console.error('Error checking out job:', error)
    return { success: false, error: error.message }
  }
}
