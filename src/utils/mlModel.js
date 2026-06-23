// Heuristic default hours for repair by appliance type
export const DEFAULT_BASE_HOURS = {
  "Mixer": 4,
  "Grinder": 5,
  "Wet Grinder": 6,
  "Gas Stove": 3,
  "Induction Stove": 4,
  "Pressure Cooker": 2,
  "Ceiling Fan": 3,
  "Table Fan": 3,
  "Iron Box": 2,
  "Water Heater": 8,
  "Air Cooler": 7,
  "Other": 5
}

// Tokenize text into words (lowercase, letters only, minimum 3 chars, filter out common stop words)
const STOP_WORDS = new Set(["the", "and", "for", "with", "this", "that", "from", "has", "not", "but", "are", "was", "were", "with", "been", "done", "some", "need", "needs"]);
export function tokenize(text) {
  if (!text) return [];
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .split(/\s+/)
    .filter(word => word.length >= 3 && !STOP_WORDS.has(word));
}

export class ServiceTimePredictor {
  constructor() {
    this.baseHours = { ...DEFAULT_BASE_HOURS };
    this.faultWeights = {}; // word -> change in hours
    this.spareWeights = {}; // word -> change in hours
    this.isTrained = false;
    this.trainingSize = 0;
    this.meanAbsoluteError = null;
  }

  // Train the model on completed jobs
  train(jobs) {
    const completedJobs = jobs.filter(job => 
      job.status === 'Completed' && 
      job.checkin_date && 
      job.checkout_date
    );

    if (completedJobs.length < 3) {
      // Not enough data to train custom weights, keep heuristics
      this.isTrained = false;
      this.trainingSize = completedJobs.length;
      return;
    }

    // 1. Compute durations
    const processedJobs = completedJobs.map(job => {
      const start = job.checkin_date.toDate ? job.checkin_date.toDate() : new Date(job.checkin_date);
      const end = job.checkout_date.toDate ? job.checkout_date.toDate() : new Date(job.checkout_date);
      const durationHours = Math.max(0.1, (end - start) / (1000 * 60 * 60));
      return {
        ...job,
        durationHours
      };
    });

    // 2. Compute base hours per category
    const categoryTotals = {};
    const categoryCounts = {};
    processedJobs.forEach(job => {
      const cat = job.product_category || 'Other';
      categoryTotals[cat] = (categoryTotals[cat] || 0) + job.durationHours;
      categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
    });

    const newBaseHours = {};
    Object.keys(DEFAULT_BASE_HOURS).forEach(cat => {
      if (categoryCounts[cat] && categoryCounts[cat] > 0) {
        newBaseHours[cat] = categoryTotals[cat] / categoryCounts[cat];
      } else {
        newBaseHours[cat] = DEFAULT_BASE_HOURS[cat]; // Fallback to heuristic base
      }
    });
    this.baseHours = newBaseHours;

    // 3. Compute text weights using regularized residuals
    const faultWordResiduals = {};
    const faultWordCounts = {};
    const spareWordResiduals = {};
    const spareWordCounts = {};

    processedJobs.forEach(job => {
      const cat = job.product_category || 'Other';
      const base = this.baseHours[cat] || this.baseHours['Other'];
      const residual = job.durationHours - base;

      const faultWords = new Set(tokenize(job.fault_description));
      faultWords.forEach(word => {
        faultWordResiduals[word] = (faultWordResiduals[word] || 0) + residual;
        faultWordCounts[word] = (faultWordCounts[word] || 0) + 1;
      });

      const spareWords = new Set(tokenize(job.spare_replaced));
      spareWords.forEach(word => {
        spareWordResiduals[word] = (spareWordResiduals[word] || 0) + residual;
        spareWordCounts[word] = (spareWordCounts[word] || 0) + 1;
      });
    });

    const regParam = 2; // Regularization term
    const newFaultWeights = {};
    Object.entries(faultWordCounts).forEach(([word, count]) => {
      newFaultWeights[word] = faultWordResiduals[word] / (count + regParam);
    });

    const newSpareWeights = {};
    Object.entries(spareWordCounts).forEach(([word, count]) => {
      newSpareWeights[word] = spareWordResiduals[word] / (count + regParam);
    });

    this.faultWeights = newFaultWeights;
    this.spareWeights = newSpareWeights;
    this.isTrained = true;
    this.trainingSize = completedJobs.length;

    // 4. Calculate Mean Absolute Error (MAE)
    let totalError = 0;
    processedJobs.forEach(job => {
      const pred = this.predictRaw(
        job.product_category, 
        job.fault_description, 
        job.spare_replaced
      );
      totalError += Math.abs(job.durationHours - pred);
    });
    this.meanAbsoluteError = totalError / processedJobs.length;
  }

  // Raw prediction in hours
  predictRaw(category, faultDescription, spareReplaced) {
    const cat = category || 'Other';
    let pred = this.baseHours[cat] || this.baseHours['Other'];

    if (this.isTrained) {
      // Use trained weights
      const faultWords = tokenize(faultDescription);
      faultWords.forEach(word => {
        if (this.faultWeights[word] !== undefined) {
          pred += this.faultWeights[word];
        }
      });

      const spareWords = tokenize(spareReplaced);
      spareWords.forEach(word => {
        if (this.spareWeights[word] !== undefined) {
          pred += this.spareWeights[word];
        }
      });
    } else {
      // Fallback to static heuristics
      const faultText = (faultDescription || '').toLowerCase();
      if (faultText.includes('burnt') || faultText.includes('smoke') || faultText.includes('fire')) pred += 4;
      if (faultText.includes('jammed') || faultText.includes('stuck') || faultText.includes('tight')) pred += 2;
      if (faultText.includes('leak') || faultText.includes('water') || faultText.includes('gas')) pred += 3;
      if (faultText.includes('broken') || faultText.includes('shattered') || faultText.includes('crack')) pred += 1.5;
      if (faultText.includes('noise') || faultText.includes('sound') || faultText.includes('vibrate')) pred += 1;
      if (faultText.includes('dead') || faultText.includes('power') || faultText.includes('start') || faultText.includes('on')) pred += 2;
      if (faultText.includes('wire') || faultText.includes('switch') || faultText.includes('plug')) pred += 1;
      if (faultText.includes('coil') || faultText.includes('winding')) pred += 3.5;
      if (faultText.includes('clean') || faultText.includes('service') || faultText.includes('maintenance')) pred -= 1;

      const spareText = (spareReplaced || '').toLowerCase();
      if (spareText.includes('motor') || spareText.includes('armature')) pred += 3;
      if (spareText.includes('capacitor')) pred += 0.5;
      if (spareText.includes('switch') || spareText.includes('regulator')) pred += 0.5;
      if (spareText.includes('bearing') || spareText.includes('bush')) pred += 1.5;
      if (spareText.includes('wire') || spareText.includes('plug') || spareText.includes('cable')) pred += 0.5;
      if (spareText.includes('thermostat') || spareText.includes('element')) pred += 2;
      if (spareText.includes('valve') || spareText.includes('gasket') || spareText.includes('safety')) pred += 0.5;
      if (spareText.includes('coil') || spareText.includes('winding')) pred += 2.5;
      if (spareText.includes('clean') || spareText.includes('oil')) pred += 0.2;
    }

    return Math.max(0.5, pred); // Minimum 30 mins
  }

  // Human-readable prediction
  predict(category, faultDescription, spareReplaced) {
    const hours = this.predictRaw(category, faultDescription, spareReplaced);
    if (hours < 1) {
      return `${Math.round(hours * 60)} minutes`;
    }
    const wholeHours = Math.floor(hours);
    const mins = Math.round((hours - wholeHours) * 60);

    if (wholeHours >= 24) {
      const days = Math.floor(wholeHours / 24);
      const remainingHours = wholeHours % 24;
      let res = `${days} day${days > 1 ? 's' : ''}`;
      if (remainingHours > 0) res += ` ${remainingHours} hr${remainingHours > 1 ? 's' : ''}`;
      return res;
    }

    let res = `${wholeHours} hr${wholeHours > 1 ? 's' : ''}`;
    if (mins > 0) res += ` ${mins} min${mins > 1 ? 's' : ''}`;
    return res;
  }
}
