# Epsilon X judges walkthrough

1. Open the website and enter as Procurement Officer. Choose **Compliance Verification**. The first tender has three fictional bidders.
2. For the first bidder click **Load fictional example**, then **Run verification**. The nine-category matrix shows score 80%, expired EPFO evidence and unclear ESIC evidence. Explain that the fixture is not an actual government lookup.
3. Open **Evidence & rule** on a row. Show the claim, reference value, validity, source, page and explanation. Change a reference ID to demonstrate a mismatch. Save and rerun; the score changes deterministically.
4. For an exemption example, edit Startup recognition: choose Not applicable and enter a tender-clause/evidence basis. Save. It remains Unclear until **Officer review -> Not applicable** is recorded with a reason. Rerun to demonstrate denominator adjustment.
5. Open **Document intelligence**. Upload `samples/fictional-bidder-evidence.txt` from the ZIP or a PDF you are authorized to use. Review the page text and save. Click **Use as claim** to populate a candidate identifier. It is still unverified until independently obtained reference evidence is entered.
6. For scanned documents, enable OCR and select a clear English scan, no more than ten pages / 3 MB. Show text extraction and its source page. OCR may take time on first use because engine assets download.
7. Open **Human decision** and request clarification with a reason. Acceptance is blocked while failed/unclear checks remain. The officer must review actual evidence before accepting any real-world record.
8. Open **Compliance report** and print/save PDF. Open **Audit Trail** to show the compliance actions. Reload to demonstrate database persistence.
9. Show **Integration readiness** to explain the implemented prototype and unconfigured production integrations. Do not claim a live registry response, certified legal compliance, or measured effort savings.
10. To show the original full procurement flow quickly, use tender 003 (awaiting authority approval) before enabling its compliance workflow. The original README explains the technical/financial/committee stages. Once statutory compliance is enabled on a tender, every bidder must be reviewed and only accepted bidders enter ranking.

CSV/JSON procurement imports are under **Database**. Nine-category reference JSON imports are under **Compliance Verification -> Document intelligence**. These are different record types.
