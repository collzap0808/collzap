import { api } from './api';

/**
 * Certificate endpoints. The shared axios client already unwraps `response.data`
 * and turns errors into `new Error(message)`, so every call here returns plain
 * data and a failed call throws an Error whose `.message` is safe to show.
 */
// Your shared axios client sends `Content-Type: application/json` by default, and with that
// header axios turns a FormData into JSON (the file becomes `{}`), which the server rejects with
// "That content type is not supported here". Saying multipart explicitly keeps the real file;
// the browser then adds the correct boundary by itself.
const multipart = { headers: { 'Content-Type': 'multipart/form-data' } };

export const certApi = {
    // ---- student ----
    myCards: () => api.get('/certificates'),
    detail: (ruleId) => api.get(`/certificates/${ruleId}`),
    // Returns { filename, pdfBase64, certificateCode, holderName }
    download: (ruleId, name) => api.post(`/certificates/${ruleId}/download`, { name }),

    // ---- public (QR code target) ----
    verify: (code) => api.get(`/public/certificates/verify/${encodeURIComponent(code)}`),

    // ---- admin ----
    admin: {
        list: () => api.get('/admin/certificates'),
        // formData: name, pointsRequired, level, active, template (.html file)
        create: (formData) => api.post('/admin/certificates', formData, multipart),
        update: (id, formData) => api.put(`/admin/certificates/${id}`, formData, multipart),
        remove: (id) => api.delete(`/admin/certificates/${id}`),
        preview: (id) => api.get(`/admin/certificates/${id}/preview`),
        issues: (id, page = 0, size = 20) =>
            api.get(`/admin/certificates/${id}/issues`, { params: { page, size } }),
    },
};

/** Saves the base64 PDF the server sends back as a real file download. */
export function savePdf({ filename, pdfBase64 }) {
    const bytes = Uint8Array.from(atob(pdfBase64), (c) => c.charCodeAt(0));
    const url = URL.createObjectURL(new Blob([bytes], { type: 'application/pdf' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || 'Collzap-Certificate.pdf';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 10000);
}