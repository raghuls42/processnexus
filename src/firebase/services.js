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
  updateDoc,
  arrayUnion,
  getDoc,
  setDoc
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

// Generate a unique bundle ID like "BNDL-2026-001"
export const generateBundleId = async () => {
  const today = new Date()
  const year = today.getFullYear()
  
  const jobsRef = collection(db, 'service_jobs')
  const q = query(jobsRef, where('checkin_date', '>=', new Date(year, 0, 1)))
  const snapshot = await getDocs(q)
  
  const bundleIds = new Set()
  snapshot.docs.forEach(doc => {
    const data = doc.data()
    if (data.bundle_id) {
      bundleIds.add(data.bundle_id)
    }
  })
  const count = bundleIds.size + 1
  
  return `BNDL-${year}-${String(count).padStart(3, '0')}`
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
      notifications: [], // Initialize empty notification log list
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
    await updateDoc(jobRef, updateData)
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

// -------------------------------------------------------------
// NOTIFICATION & SETTINGS SERVICES
// -------------------------------------------------------------

// Fetch notification templates from settings
export const getNotificationTemplates = async () => {
  try {
    const docRef = doc(db, 'system_settings', 'templates')
    const docSnap = await getDoc(docRef)
    if (docSnap.exists()) {
      return docSnap.data()
    } else {
      // Default templates with variables
      const defaultTemplates = {
        intake_sms: "Hello {customer_name}, your {brand} {model_name} has been received for service with Job ID: {job_id}. - ProcessNexus",
        intake_email: "Dear {customer_name},\n\nYour {brand} {model_name} has been checked in for repair with Job ID: {job_id}.\n\nReported Issue: {fault_description}\nAssigned Technician: {assigned_technician}\n\nWe will update you once the diagnosis is complete.\n\nBest regards,\nProcessNexus",
        ready_sms: "Hello {customer_name}, your {brand} {model_name} (Job: {job_id}) is ready for pickup. Charges: ₹{service_cost}. - ProcessNexus",
        ready_email: "Dear {customer_name},\n\nWe are pleased to inform you that your {brand} {model_name} (Job: {job_id}) is ready for pickup.\n\nSpare Parts Replaced: {spare_replaced}\nService Cost: ₹{service_cost}\n\nBest regards,\nProcessNexus",
        closed_sms: "Hello {customer_name}, your {brand} {model_name} (Job: {job_id}) has been checked out. Thank you! - ProcessNexus",
        closed_email: "Dear {customer_name},\n\nYour {brand} {model_name} (Job: {job_id}) has been successfully checked out.\n\nTotal Paid: ₹{amount_paid}\nPayment Method: {payment_method}\n\nThank you for choosing ProcessNexus.\n\nBest regards,\nProcessNexus"
      }
      await setDoc(docRef, defaultTemplates)
      return defaultTemplates
    }
  } catch (error) {
    console.error('Error fetching notification templates:', error)
    return {
      intake_sms: "Hello {customer_name}, your {brand} {model_name} has been received for service with Job ID: {job_id}. - ProcessNexus",
      intake_email: "Dear {customer_name},\n\nYour {brand} {model_name} has been checked in for repair with Job ID: {job_id}.\n\nReported Issue: {fault_description}\nAssigned Technician: {assigned_technician}\n\nWe will update you once the diagnosis is complete.\n\nBest regards,\nProcessNexus",
      ready_sms: "Hello {customer_name}, your {brand} {model_name} (Job: {job_id}) is ready for pickup. Charges: ₹{service_cost}. - ProcessNexus",
      ready_email: "Dear {customer_name},\n\nWe are pleased to inform you that your {brand} {model_name} (Job: {job_id}) is ready for pickup.\n\nSpare Parts Replaced: {spare_replaced}\nService Cost: ₹{service_cost}\n\nBest regards,\nProcessNexus",
      closed_sms: "Hello {customer_name}, your {brand} {model_name} (Job: {job_id}) has been checked out. Thank you! - ProcessNexus",
      closed_email: "Dear {customer_name},\n\nYour {brand} {model_name} (Job: {job_id}) has been successfully checked out.\n\nTotal Paid: ₹{amount_paid}\nPayment Method: {payment_method}\n\nThank you for choosing ProcessNexus.\n\nBest regards,\nProcessNexus"
    }
  }
}

// Save notification templates to settings
export const saveNotificationTemplates = async (templates) => {
  try {
    const docRef = doc(db, 'system_settings', 'templates')
    await setDoc(docRef, templates)
    return { success: true }
  } catch (error) {
    console.error('Error saving templates:', error)
    return { success: false, error: error.message }
  }
}

// Log a sent notification (both in global history and within the specific job log)
export const logNotification = async (jobId, jobDocId, notificationData) => {
  try {
    const timestamp = new Date()
    const logEntry = {
      job_id: jobId,
      customer_name: notificationData.customer_name || 'N/A',
      contact_number: notificationData.contact_number || 'N/A',
      channel: notificationData.channel, // 'SMS' or 'Email'
      type: notificationData.type, // 'Intake', 'Ready', or 'Closed'
      message: notificationData.message,
      timestamp: timestamp.toISOString(), // Use ISO string for consistent serialization in arrays
      status: "Sent"
    }

    // 1. Add doc to global logs collection
    await addDoc(collection(db, 'notifications_history'), {
      ...logEntry,
      timestamp: serverTimestamp() // Database server timestamp for ordering
    })

    // 2. Append to local job document's notifications list
    const jobRef = doc(db, 'service_jobs', jobDocId)
    await updateDoc(jobRef, {
      notifications: arrayUnion(logEntry)
    })

    return { success: true }
  } catch (error) {
    console.error('Error logging notification:', error)
    return { success: false, error: error.message }
  }
}

// Fetch global notification history log
export const getGlobalNotificationLogs = async () => {
  try {
    const snapshot = await getDocs(
      query(collection(db, 'notifications_history'), orderBy('timestamp', 'desc'))
    )
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
  } catch (error) {
    console.error('Error fetching global notifications history:', error)
    return []
  }
}
