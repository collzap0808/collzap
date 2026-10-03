package collzap.backend.service;

import com.google.zxing.BarcodeFormat;
import com.google.zxing.EncodeHintType;
import com.google.zxing.WriterException;
import com.google.zxing.client.j2se.MatrixToImageWriter;
import com.google.zxing.common.BitMatrix;
import com.google.zxing.qrcode.QRCodeWriter;
import com.openhtmltopdf.pdfboxout.PdfRendererBuilder;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Attribute;
import org.jsoup.nodes.DataNode;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.jsoup.nodes.Entities;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.util.HtmlUtils;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.ArrayList;
import java.util.Base64;
import java.util.HashMap;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Template placeholders an admin can use in the HTML file:
 * {{studentName}} {{collegeName}} {{certificateCode}} {{level}} {{points}}
 * {{issuedDate}} {{certificateName}} {{qrCode}}  (use qrCode like: <img src="{{qrCode}}">)
 */
@Component
public class CertificateRenderer {

    private static final Pattern PLACEHOLDER = Pattern.compile("\\{\\{\\s*(\\w+)\\s*\\}\\}");
    private static final Pattern CSS_IMPORT = Pattern.compile("(?i)@import[^;]*;?");
    private static final Pattern CSS_URL = Pattern.compile("(?i)url\\(\\s*(?!['\"]?\\s*data:)[^)]*\\)");
    private static final Set<String> URL_ATTRS =
            Set.of("src", "href", "background", "poster", "srcset", "xlink:href", "data");

    @Value("${collzap.certificate.verify-base-url:http://localhost:5173/verify-certificate}")
    private String verifyBaseUrl;

    /** Remove scripts, external files, event handlers. Only data: images are allowed. */
    public String sanitize(String rawHtml) {
        Document doc = Jsoup.parse(rawHtml);
        doc.select("script,iframe,frame,frameset,object,embed,link,base,form,input,button,select,"
                + "textarea,audio,video,applet,meta[http-equiv]").remove();

        for (Element el : doc.getAllElements()) {
            for (Attribute a : new ArrayList<>(el.attributes().asList())) {
                String key = a.getKey().toLowerCase(Locale.ROOT);
                String val = a.getValue().trim();
                if (key.startsWith("on")) {
                    el.removeAttr(a.getKey());
                } else if (URL_ATTRS.contains(key)) {
                    String v = val.toLowerCase(Locale.ROOT);
                    if (!(v.startsWith("data:image/") || v.startsWith("{{"))) {
                        el.removeAttr(a.getKey());
                    }
                } else if (key.equals("style")) {
                    el.attr(a.getKey(), cleanCss(val));
                }
            }
        }
        for (Element st : doc.select("style")) {
            String css = cleanCss(st.data());
            st.empty();
            st.appendChild(new DataNode(css));
        }
        if (doc.head().select("meta[charset]").isEmpty()) {
            doc.head().prependElement("meta").attr("charset", "UTF-8");
        }
        doc.outputSettings().prettyPrint(false);
        return doc.outerHtml();
    }

    private String cleanCss(String css) {
        String out = CSS_IMPORT.matcher(css).replaceAll("");
        return CSS_URL.matcher(out).replaceAll("none");
    }

    /**
     * Builds the placeholder values (HTML-escaped). If name is null, {{studentName}} is left in
     * the HTML so the browser can fill it while the student types.
     */
    public Map<String, String> values(String name, String college, String code, String level,
                                      long points, String date, String certificateName) {
        Map<String, String> v = new HashMap<>();
        v.put("studentName", name == null ? null : esc(name));
        v.put("collegeName", esc(college));
        v.put("certificateCode", esc(code));
        v.put("level", esc(level));
        v.put("points", String.valueOf(points));
        v.put("issuedDate", esc(date));
        v.put("certificateName", esc(certificateName));
        v.put("qrCode", qrDataUri(verifyBaseUrl + "/" + code));
        return v;
    }

    public String fill(String html, Map<String, String> values) {
        Matcher m = PLACEHOLDER.matcher(html);
        StringBuilder sb = new StringBuilder();
        while (m.find()) {
            String key = m.group(1);
            String rep;
            if (values.containsKey(key)) {
                rep = values.get(key);
                if (rep == null) rep = m.group(0);
            } else {
                rep = "";
            }
            m.appendReplacement(sb, Matcher.quoteReplacement(rep));
        }
        m.appendTail(sb);
        return sb.toString();
    }

    public byte[] pdf(String filledHtml) {
        try (ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            // openhtmltopdf needs well-formed XHTML; jsoup turns any HTML into that.
            Document doc = Jsoup.parse(filledHtml);
            doc.outputSettings()
                    .syntax(Document.OutputSettings.Syntax.xml)
                    .escapeMode(Entities.EscapeMode.xhtml)
                    .prettyPrint(false);
            PdfRendererBuilder b = new PdfRendererBuilder();
            b.useFastMode();
            b.withHtmlContent(doc.html(), null);
            b.toStream(out);
            b.run();
            return out.toByteArray();
        } catch (Exception e) {
            throw new IllegalStateException("Could not create certificate PDF", e);
        }
    }

    public String qrDataUri(String text) {
        try {
            BitMatrix matrix = new QRCodeWriter()
                    .encode(text, BarcodeFormat.QR_CODE, 320, 320, Map.of(EncodeHintType.MARGIN, 1));
            BufferedImage img = MatrixToImageWriter.toBufferedImage(matrix);
            ByteArrayOutputStream o = new ByteArrayOutputStream();
            ImageIO.write(img, "png", o);
            return "data:image/png;base64," + Base64.getEncoder().encodeToString(o.toByteArray());
        } catch (WriterException | IOException e) {
            throw new IllegalStateException("Could not create QR code", e);
        }
    }

    private String esc(String s) {
        return s == null ? "" : HtmlUtils.htmlEscape(s);
    }
}
