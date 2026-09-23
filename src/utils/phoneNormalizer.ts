import { Lead } from '../types/crm';

/**
 * Normalizes phone numbers for accurate duplicate comparison.
 * Removes spaces, hyphens, parentheses, and handles common regional zero prefixes.
 */
export function normalizePhoneNumber(rawPhone: string): string {
  if (!rawPhone) return '';
  // Remove non-digit characters except leading plus
  let cleaned = rawPhone.trim().replace(/[^\d+]/g, '');

  // Handle leading zeros for Pakistan (+92)
  if (cleaned.startsWith('03') && cleaned.length === 11) {
    cleaned = '+92' + cleaned.slice(1);
  } else if (cleaned.startsWith('923') && cleaned.length === 12) {
    cleaned = '+' + cleaned;
  }

  // Handle leading zeros for UAE (+971)
  if (cleaned.startsWith('05') && cleaned.length === 10) {
    cleaned = '+971' + cleaned.slice(1);
  } else if (cleaned.startsWith('9715') && cleaned.length === 12) {
    cleaned = '+' + cleaned;
  }

  // Handle standard international plus format
  if (!cleaned.startsWith('+') && cleaned.length >= 10) {
    // If no plus, ensure consistent comparison format
    cleaned = '+' + cleaned;
  }

  return cleaned;
}

/**
 * Compares two phone numbers considering regional variations.
 */
export function arePhonesMatching(phoneA: string, phoneB: string): boolean {
  if (!phoneA || !phoneB) return false;
  const normA = normalizePhoneNumber(phoneA);
  const normB = normalizePhoneNumber(phoneB);

  if (normA === normB) return true;

  // Compare last 9 digits (handles country code difference edge-cases)
  const digitsA = normA.replace(/\D/g, '');
  const digitsB = normB.replace(/\D/g, '');

  if (digitsA.length >= 9 && digitsB.length >= 9) {
    const tailA = digitsA.slice(-9);
    const tailB = digitsB.slice(-9);
    if (tailA === tailB) return true;
  }

  return false;
}

/**
 * Normalizes domain or URL for website deduplication.
 */
export function normalizeDomain(url?: string): string {
  if (!url) return '';
  let clean = url.trim().toLowerCase();
  clean = clean.replace(/^https?:\/\//, '').replace(/^www\./, '');
  return clean.split('/')[0];
}

/**
 * Simple token-based fuzzy string similarity (Jaccard on words) for business names.
 */
export function businessNameSimilarity(nameA: string, nameB: string): number {
  if (!nameA || !nameB) return 0;
  const cleanA = nameA.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();
  const cleanB = nameB.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();

  if (cleanA === cleanB) return 1.0;

  // If one contains the other directly
  if (cleanA.includes(cleanB) || cleanB.includes(cleanA)) {
    return 0.85;
  }

  const tokensA = new Set(cleanA.split(/\s+/).filter(w => w.length > 1 && !['and', '&', 'the', 'pvt', 'ltd', 'co', 'technologies', 'clinic', 'hub'].includes(w)));
  const tokensB = new Set(cleanB.split(/\s+/).filter(w => w.length > 1 && !['and', '&', 'the', 'pvt', 'ltd', 'co', 'technologies', 'clinic', 'hub'].includes(w)));

  if (tokensA.size === 0 || tokensB.size === 0) return 0;

  let intersection = 0;
  for (const token of tokensA) {
    if (tokensB.has(token)) intersection++;
  }

  const union = new Set([...tokensA, ...tokensB]).size;
  return union > 0 ? intersection / union : 0;
}

export interface DuplicateCheckResult {
  hasDuplicate: boolean;
  matchType?: 'Phone' | 'WhatsApp' | 'Email' | 'Business Name' | 'Website';
  matchedLead?: Lead;
  confidence: 'Exact' | 'High' | 'Possible';
  message: string;
}

export function checkLeadDuplicates(
  input: {
    phone?: string;
    whatsapp?: string;
    email?: string;
    businessName?: string;
    website?: string;
    excludeLeadId?: string;
  },
  existingLeads: Lead[]
): DuplicateCheckResult {
  for (const lead of existingLeads) {
    if (input.excludeLeadId && lead.id === input.excludeLeadId) continue;

    // 1. Phone match (CRITICAL)
    if (input.phone && lead.phone && arePhonesMatching(input.phone, lead.phone)) {
      return {
        hasDuplicate: true,
        matchType: 'Phone',
        matchedLead: lead,
        confidence: 'Exact',
        message: `Phone number ${input.phone} already matches lead "${lead.businessName}".`,
      };
    }

    // 2. WhatsApp match
    if (input.whatsapp && lead.whatsapp && arePhonesMatching(input.whatsapp, lead.whatsapp)) {
      return {
        hasDuplicate: true,
        matchType: 'WhatsApp',
        matchedLead: lead,
        confidence: 'Exact',
        message: `WhatsApp number ${input.whatsapp} already exists for "${lead.businessName}".`,
      };
    }

    // 3. Cross check phone vs whatsapp
    if (input.phone && lead.whatsapp && arePhonesMatching(input.phone, lead.whatsapp)) {
      return {
        hasDuplicate: true,
        matchType: 'Phone',
        matchedLead: lead,
        confidence: 'Exact',
        message: `Phone number ${input.phone} is recorded as WhatsApp on "${lead.businessName}".`,
      };
    }

    // 4. Email match
    if (input.email && lead.email && input.email.trim().toLowerCase() === lead.email.trim().toLowerCase()) {
      return {
        hasDuplicate: true,
        matchType: 'Email',
        matchedLead: lead,
        confidence: 'Exact',
        message: `Email address ${input.email} is already registered to "${lead.businessName}".`,
      };
    }

    // 5. Website domain match
    if (input.website && lead.website) {
      const domA = normalizeDomain(input.website);
      const domB = normalizeDomain(lead.website);
      if (domA && domB && domA === domB) {
        return {
          hasDuplicate: true,
          matchType: 'Website',
          matchedLead: lead,
          confidence: 'High',
          message: `Website domain ${domA} matches existing lead "${lead.businessName}".`,
        };
      }
    }

    // 6. Fuzzy Business Name match
    if (input.businessName && lead.businessName) {
      const sim = businessNameSimilarity(input.businessName, lead.businessName);
      if (sim >= 0.7) {
        return {
          hasDuplicate: true,
          matchType: 'Business Name',
          matchedLead: lead,
          confidence: sim > 0.85 ? 'High' : 'Possible',
          message: `Business name "${input.businessName}" closely matches existing lead "${lead.businessName}" (${Math.round(sim * 100)}% match).`,
        };
      }
    }
  }

  return {
    hasDuplicate: false,
    confidence: 'Exact',
    message: 'No duplicate found. Safe to contact or register.',
  };
}
