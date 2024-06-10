import React, { useCallback, useRef } from "react";
import { jsPDF } from "jspdf";
import PrintOutlinedIcon from "@mui/icons-material/PrintOutlined";
import ParishIdPic from "../images/Parish.jpg";
import DeaneryIdPic from "../images/Deanery.jpg";
import DexcoIdPic from "../images/Dexco.jpg";
import dayjs from "dayjs";
import { toPng } from "html-to-image";
import { saveAs } from "file-saver";


const IDCard = ({ data }) => {
  const ref = useRef(null);

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

  const handlePrint = () => {
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: [56, 88], // ID card size in mm
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const centerX = pageWidth / 2;

    pdf.addImage(IdPic, "JPEG", 0, 0, 56, 88);
    pdf.addFont("Gafata-Regular.ttf", "Gafata", "normal");
    pdf.addFont("TiroDevanagariHindi-Regular.ttf", "Devanagari", "normal");

    // Adding text and photo
    pdf.setFontSize(12);
    pdf.setTextColor("#C01E2C");
    pdf.setFont("Devanagari");
    pdf.text(data.name, centerX, 39, { align: "center" });

    pdf.setFont("Gafata");
    pdf.setFontSize(8);
    pdf.setTextColor(0, 0, 0); // Assuming black text color
    pdf.text(`: ${data.father_name}`, 20, 65);
    pdf.text(`: ${data.deanery}`, 20, 43.5);
    pdf.text(`: ${data.parish}`, 20, 47.5);
    pdf.text(`: ${dayjs(data.date_of_baptism).format("DD-MM-YYYY")}`, 20, 52);
    pdf.text(`: ${dayjs(data.date_of_birth).format("DD-MM-YYYY")}`, 20, 56.5);
    pdf.text(`: ${data.phone}`, 20, 61);

    // Split address into multiple lines
    const addressLines = pdf.splitTextToSize(`: ${data.postal_address}`, 35); // Adjust the max width as needed
    let y = 69.5; // Initial y-coordinate for address

    // Draw each line of the address
    addressLines.forEach((line) => {
      pdf.text(line, 20, y);
      y += 3; // Adjust line spacing as needed
    });

    // Drawing a rounded rectangle for the photo
    const imgX = 21;
    const imgY = 17;
    const imgWidth = 14;
    const imgHeight = 18;
    const radius = 0;

    pdf.setDrawColor(0, 0, 0);
    pdf.roundedRect(imgX, imgY, imgWidth, imgHeight, radius, radius, "S");

    if (data.photo) {
      pdf.addImage(data.photo, "JPEG", imgX, imgY, imgWidth, imgHeight);
    }

    pdf.save("id-card.pdf");
  };

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
  }, [ref]);

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
            left: "52.5mm",
            width: "35mm",
            height: "40mm",
            border: "1px solid #8D8D8D",
            objectFit: "cover",
            borderRadius: "2px",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: "95mm",
            left: "50%",
            transform: "translateX(-50%)",
            fontSize: "24px",
            color: "#C01E2C",
            fontFamily: "Roboto",
            textAlign: "center",
            width: "80px",
          }}
        >
          {data.designation}
        </div>
        <div
          style={{
            position: "absolute",
            top: "83.3mm",
            left: "50%",
            transform: "translateX(-50%)",
            fontSize: "48px",
            color: "#C01E2C",
            fontFamily: "TiroDevanagariHindi-Regular",
            textAlign: "center",
            width: "2190px",
          }}
        >
          {data.name}
        </div>
        <div
          style={{
            position: "absolute",
            top: "103mm",
            left: "55mm",
            fontSize: "30px",
            fontFamily: "Gafata",
          }}
        >
          : {data.deanery}
        </div>
        <div
          style={{
            position: "absolute",
            top: "107mm",
            left: "55mm",
            fontSize: "30px",
            fontFamily: "Gafata",
          }}
        >
          : {data.parish}
        </div>
        <div
          style={{
            position: "absolute",
            top: "111mm",
            left: "55mm",
            fontSize: "30px",
            fontFamily: "Gafata",
          }}
        >
          : {dayjs(data.date_of_baptism).format("DD-MM-YYYY")}
        </div>
        <div
          style={{
            position: "absolute",
            top: "115mm",
            left: "55mm",
            fontSize: "30px",
            fontFamily: "Gafata",
          }}
        >
          : {dayjs(data.date_of_birth).format("DD-MM-YYYY")}
        </div>
        <div
          style={{
            position: "absolute",
            top: "120mm",
            left: "55mm",
            fontSize: "30px",
            fontFamily: "Gafata",
          }}
        >
          : {data.phone}
        </div>
        <div
          style={{
            position: "absolute",
            top: "126mm",
            left: "55mm",
            fontSize: "30px",
            fontFamily: "Gafata",
          }}
        >
          : {data.father_name}
        </div>
        <div
          style={{
            position: "absolute",
            top: "130mm",
            left: "55mm",
            fontSize: "30px",
            fontFamily: "Gafata",
            width: "35mm",
            whiteSpace: "pre-wrap",
          }}
        >
          :
        </div>
        <div
          style={{
            position: "absolute",
            top: "130mm",
            left: "56mm",
            fontSize: "30px",
            fontFamily: "Gafata",
            width: "35mm",
            whiteSpace: "pre-wrap",
          }}
        >
          {data.postal_address}
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
