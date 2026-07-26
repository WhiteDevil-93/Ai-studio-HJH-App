# Clinical review list

This is the focused review queue for the next clinical session. Content remains
visible in the application as transcribed; no item on this list should be
silently harmonised.

## Priority 1 — calculation or dosing decisions

1. **Corrected sodium, HJH PDF pages 92 and 97**
   - Page 92 uses a 5.5 mmol/L glucose baseline and a factor of 1.6 for glucose
     11–22, changing to 2.4 above 22.
   - Page 97 prints `Na + [2.4 × (glucose − 5.4) / 5.4]`.
   - Decide whether both context-specific equations remain, or whether one
     hospital-wide equation should replace them.

2. **Propofol infusion, HJH PDF page 117**
   - The page prints 400 mg in 40 mL and labels the concentration 20 mg/mL.
   - The preparation arithmetic and rate table correspond to 10 mg/mL.
   - Confirm the intended concentration and whether the loading and
     continuation tables require correction.

3. **Ketamine infusion, HJH PDF page 106**
   - Confirm the 60 kg cells at 0.7, 0.8, and 0.9 mg/kg/hr against the stated
     1 mg/mL concentration.

4. **Phenylephrine infusion, HJH PDF page 111**
   - Confirm the table cells that do not match the stated 100 mcg/mL
     concentration, including 0.3/40 kg, 0.4/60 kg, and 0.9/90 kg.

5. **Burch-Wartofsky score, HJH PDF pages 189–190**
   - Confirm that the printed `13–139` heart-rate band should read `130–139`.
   - Confirm the final score thresholds and management wording.

## Priority 2 — source ownership and scope

6. **Bara/CHBAH ICU dosing material**
   - The existing dosing content has been retained in the app.
   - Obtain the exact review copy/version, document date, and owner approval.
   - Compare each concentration, dose range, and paediatric field against that
     controlled copy.

7. **Paediatric dosing**
   - HJH states that its guideline is largely adult-focused and should be used
     with RMMCH protocols for paediatric patients.
   - Confirm which paediatric entries come from Bara and which require RMMCH
     verification.

8. **Remaining provenance**
   - Work through the unresolved-entry inventory produced by
     `npm run validate:data`.
   - Record source page, reviewer, review date, and decision for each approved
     entry.

9. **Weight and infusion calculation sweep**
   - Verify every displayed adult and paediatric weight-based regimen against
     the controlled source, including maximum doses and frequency.
   - Verify the configured preparation and dose range for each HJH infusion
     page.
   - Confirm the standard concentrations to prefill for Bara ICU infusions.
     Until confirmed, the app requires entry of the actual prepared
     concentration.

## Sign-off record

For every reviewed item, record:

- Decision and corrected wording, if any
- Source document and page
- Clinical reviewer name
- Second reviewer name
- Review date
- Content version
