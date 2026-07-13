import { useCallback, useEffect, useRef, useState } from "react";
import PrintOutlinedIcon from "@mui/icons-material/PrintOutlined";
import ParishIdPic from "../assets/images/Parish.jpg";
import DeaneryIdPic from "../assets/images/Deanery.jpg";
import DexcoIdPic from "../assets/images/Dexco.jpg";
import dayjs from "dayjs";
import { toPng } from "html-to-image";
import { capitalizeName } from "../utils/text-format";
// Platform Phase 4: template-driven branch. When a designed template exists
// for this diocese + level it renders instead; the hardcoded legacy layout
// below stays untouched as the fallback (pixel parity for diocese 1).
import TemplateCardRenderer from "./TemplateCardRenderer";
import { resolveIdCardTemplate, ensureProfileQr } from "../api/platformApi";
import { toQrDataUrl } from "../utils/qrHelpers";


const IDCard = ({ data }) => {
  const ref = useRef(null);
  // Phase 4: null = no template (legacy render); object = designed template.
  const [template, setTemplate] = useState(null);
  // Phase 6: SVG data URL for the template's `qr` element (placeholder until resolved).
  const [qrImageUrl, setQrImageUrl] = useState(null);

  useEffect(() => {
    let active = true;
    resolveIdCardTemplate(data.level)
      .then((res) => {
        if (active) {
          setTemplate((res.success && res.data && res.data.template) || null);
        }
      })
      .catch(() => {
        if (active) setTemplate(null);
      });
    return () => {
      active = false;
    };
  }, [data.level]);

  // Phase 6: when the template contains a `qr` element, fetch/mint this
  // profile's token and render the CYD:<slug>:<qr_token> payload. Failures
  // (older backend, missing permission) leave the placeholder — never break
  // the card.
  const templateHasQr = !!(
    template &&
    template.layout_json &&
    Array.isArray(template.layout_json.elements) &&
    template.layout_json.elements.some((element) => element.type === 'qr')
  );

  useEffect(() => {
    let active = true;
    setQrImageUrl(null);
    if (!templateHasQr || !data.id) return undefined;
    ensureProfileQr(data.id)
      .then(async (res) => {
        if (!res.success || !res.data || !res.data.payload) return;
        const image = await toQrDataUrl(res.data.payload);
        if (active) setQrImageUrl(image);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [templateHasQr, data.id]);


  let IdPic;
  switch (data.level) {
    case "parish":
      IdPic = ParishIdPic;
      break;
    case "deanery":
      IdPic = DeaneryIdPic;
      break;
    case "dexco":
      IdPic = DexcoIdPic;
      break;
    default:
      IdPic = ParishIdPic; // Default to parish image
      break;
  }

  const handleDownloadImage = useCallback(() => {
    if (ref.current === null) {
      return;
    }

    toPng(ref.current, { cacheBust: true, scale: 3 })
      .then((dataUrl) => {
        const link = document.createElement("a");
        link.download = `${data.name}-${data.parish}-${data.phone}`;
        link.href = dataUrl;
        link.click();
      })
      .catch((err) => {
        console.error("Failed to convert to image:", err);
      });
  }, [data.name, data.parish, data.phone]);

  // Phase 4: designed template found — render it through the shared template
  // renderer (same html-to-image export path). Legacy layout continues below
  // when no template exists.
  if (template) {
    return (
      <div>
        <TemplateCardRenderer
          ref={ref}
          template={template}
          data={qrImageUrl ? { ...data, qr_image_url: qrImageUrl } : data}
        />
        <button
          onClick={handleDownloadImage}
          style={{
            marginTop: "10px",
            padding: "5px 10px",
            cursor: "pointer",
          }}
        >
          <PrintOutlinedIcon /> Download as PNG
        </button>
      </div>
    );
  }

  return (
    <div>
      <div
        ref={ref}
        className="card-container"
        style={{
          position: "relative",
          width: "146.3mm",
          height: "221.8mm",
          backgroundImage: `url(${IdPic})`,
          backgroundSize: "cover",
          backgroundRepeat: "no-repeat",
          overflow: "hidden",
        }}
      >
        <img
          src={data.photo}
          alt="User Pic"
          style={{
            position: "absolute",
            top: "42.5mm",
            left: "50%",
            transform: "translateX(-50%)",
            width: "58mm",
            height: "67mm",
            border: "1px solid #8D8D8D",
            objectFit: "cover",
            borderRadius: "14px",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: "121mm",
            left: "50%",
            transform: "translateX(-50%)",
            fontSize: "16px",
            color: "#C01E2C",
            fontFamily: "Roboto",
            textAlign: "center",
            width: "2190px",
          }}
        >
          {data.designation}
        </div>
        <div
          style={{
            position: "absolute",
            top: "111.2mm",
            left: "50%",
            transform: "translateX(-50%)",
            fontSize: "31.5px",
            color: "#C01E2C",
            fontFamily: "Vidaloka",
            textAlign: "center",
            width: "2190px",
          }}
        >
          {capitalizeName(data.name)}
        </div>
        <div
          style={{
            position: "absolute",
            top: "128mm",
            left: "54mm",
            fontSize: "24.2px",
            fontFamily: "Gafata",
            color: "#000000",
          }}
        >
          : {data.deanery}
        </div>
        <div
          style={{
            position: "absolute",
            top: "136.1mm",
            left: "54mm",
            fontSize: "24.2px",
            fontFamily: "Gafata",
            color: "#000000",
          }}
        >
          : {data.parish}
        </div>
        <div
          style={{
            position: "absolute",
            top: "144.12mm",
            left: "54mm",
            fontSize: "24.2px",
            fontFamily: "Gafata",
            color: "#000000",
          }}
        >
          : {dayjs(data.date_of_baptism).format("DD-MM-YYYY")}
        </div>
        <div
          style={{
            position: "absolute",
            top: "152.4mm",
            left: "54mm",
            fontSize: "24.2px",
            fontFamily: "Gafata",
            color: "#000000",
          }}
        >
          : {dayjs(data.date_of_birth).format("DD-MM-YYYY")}
        </div>
        <div
          style={{
            position: "absolute",
            top: "160.68mm",
            left: "54mm",
            fontSize: "24.2px",
            fontFamily: "Gafata",
            color: "#000000",
          }}
        >
          : {data.phone}
        </div>
        <div
          style={{
            position: "absolute",
            top: "168.96mm",
            left: "54mm",
            fontSize: "24.2px",
            fontFamily: "Gafata",
            color: "#000000",
          }}
        >
          : {data.father_name}
        </div>
        <div
          style={{
            position: "absolute",
            top: "177.24mm",
            left: "54mm",
            fontSize: "24.2px",
            fontFamily: "Gafata",
            color: "#000000",
            width: "35mm",
            whiteSpace: "pre-wrap",
          }}
        >
          :
        </div>
        <div
          style={{
            position: "absolute",
            top: "177.5mm",
            left: "56.9mm",
            fontSize: "24.2px",
            fontFamily: "Gafata",
            color: "#000000",
            width: "82mm",
            whiteSpace: "pre-wrap",
            lineHeight: "96.5%"
          }}
        >
          {data.postal_address}
        </div>
        <div
          style={{
            position: "absolute",
            top: "213mm",
            left: "50%",
            transform: "translateX(-50%)",
            fontSize: "19px",
            // fontWeight:'bold',
            fontFamily: "roboto",
            color: "#fff",
            textAlign: "center",
            width: "100mm",
          }}
        >
          |
        </div>  
        <div
          style={{
            position: "absolute",
            top: "213mm",
            left: "50%",
            transform: "translateX(-50%)",
            fontSize: "19px",
            // fontWeight:'bold',
            fontFamily: "roboto",
            color: "#fff",
            textAlign: "left",
            width: "100mm",
          }}
        >
          Issued: {dayjs(data.issue_date).format("DD-MM-YYYY")}
        </div>      
        <div
          style={{
            position: "absolute",
            top: "213mm",
            left: "50%",
            transform: "translateX(-50%)",
            fontSize: "19px",
            // fontWeight:'bold',
            fontFamily: "roboto",
            color: "#fff",
            textAlign: "right",
            width: "100mm",
          }}
        >
          Valid for two years
        </div>      
      </div>
      
      {/* <button
        onClick={handlePrint}
        style={{
          marginTop: "10px",
          padding: "5px 10px",
          cursor: "pointer",
        }}
      >
        <PrintOutlinedIcon /> Print
      </button> */}
      <button
        onClick={handleDownloadImage}
        style={{
          marginTop: "10px",
          padding: "5px 10px",
          cursor: "pointer",
        }}
      >
        <PrintOutlinedIcon /> Download as PNG
      </button>
    </div>
  );
};

export default IDCard;
