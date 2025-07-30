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
  console.log(data,'data');
  

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
    pdf.setFontSize(7);
    pdf.setTextColor(255, 255, 255);
    pdf.text(`Issued: ${dayjs(data.issue_date).format("DD/MM/YY")} • Expires: ${dayjs(data.issue_date).add(2, 'year').format("DD/MM/YY")}`, centerX, 83, { align: "center" });

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
          {data.name}
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
          Issued: {dayjs(data.issue_date).format("DD-MM-YYYY")} • Valid till: {dayjs(data.issue_date).add(2, 'year').format("DD-MM-YYYY")}
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
