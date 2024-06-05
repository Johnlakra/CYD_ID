// IDCard.js
import React, { useRef } from "react";
import { jsPDF } from "jspdf";
import PrintOutlinedIcon from "@mui/icons-material/PrintOutlined";
import IdPic from "../images/id-card-cyd.jpg"
import dayjs from "dayjs";

const IDCard = ({ data }) => {
    const componentRef = useRef();

    const handlePrint = () => {
        const pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: [56, 88] // ID card size in mm
        });

        const pageWidth = pdf.internal.pageSize.getWidth();
        const centerX = pageWidth / 2;

        // Background image
        // const backgroundImg = {IdPic}; // Update with the correct path

        pdf.addImage(IdPic, 'JPEG', 0, 0, 56, 88);

        // Adding text and photo
        pdf.setFontSize(14);
        pdf.setTextColor("#C01E2C");
        pdf.setFont('helvetica', 'normal');
        pdf.text(data.name, centerX, 40, { align: 'center' });

        // pdf.addFont('/fonts/Gafata-Regular.ttf', 'Gafata', 'normal');
        // pdf.setFont('Gafata');
        console.log(pdf.getFontList(), "getFontList");
        console.log(data, 'data');
      
        pdf.setFontSize(8);
        pdf.setTextColor(0, 0, 0); // Assuming black text color
        pdf.text(`${data.father_name}`, 27, 63);
        pdf.text(` ${data.deanery}`, 2, 47);
        pdf.text(` ${data.parish}`, 27, 47);
        pdf.text(` ${dayjs(data.date_of_birth).format('DD-MM-YYYY')}`, 27, 55);
        pdf.text(` ${dayjs(data.date_of_baptism).format('DD-MM-YYYY')}`, 2, 55);
        pdf.text(` ${data.phone}`, 2, 63);

        // Split address into multiple lines
        const addressLines = pdf.splitTextToSize(data.postal_address, 50); // Adjust the max width as needed
        let y = 70; // Initial y-coordinate for address

        // Draw each line of the address
        addressLines.forEach((line) => {
            pdf.text(line, 3, y);
            y += 3; // Adjust line spacing as needed
        });

        // Drawing a rounded rectangle for the photo
        const imgX = 21;
        const imgY = 17;
        const imgWidth = 14;
        const imgHeight = 18;
        const radius = 0;

        pdf.setDrawColor(0, 0, 0);
        pdf.roundedRect(imgX, imgY, imgWidth, imgHeight, radius, radius, 'S', { align: 'center' });

        // Adding the photo
        if (data.photo) {
            pdf.addImage(data.photo, 'JPEG', imgX, imgY, imgWidth, imgHeight, { align: 'center' });
        }

        pdf.save('id-card.pdf');
    };

    return (
        <div>
            <div
                ref={componentRef}
                className="card-container"
                style={{
                    position: "relative",
                    width: "56mm",
                    height: "88mm",
                    border: "1px solid #ccc",
                    margin: "20px auto",
                    backgroundImage: `url(${IdPic})`,
                    backgroundSize: 'cover',
                    backgroundRepeat: 'no-repeat',
                    overflow: 'hidden',
                }}
            >
                <div style={{ padding: "10px", fontSize: "10px" }}>
                    <img
                        src={data.photo}
                        alt="User Pic"
                        style={{
                            width: "50%",
                            height: "50%",
                            objectFit: "cover",
                            borderRadius: "5px",
                        }}
                    />
                    <div style={{ marginTop: "10px" }}>
                        <strong>Name:</strong> {data.name}
                    </div>
                    <div>
                        <strong>Father:</strong> {data.father_name}
                    </div>
                    <div>
                        <strong>Mother:</strong> {data.mother_name}
                    </div>
                    <div>
                        <strong>DOB:</strong> {data.date_of_birth}
                    </div>
                    <div>
                        <strong>Baptism:</strong> {data.date_of_baptism}
                    </div>
                    <div>
                        <strong>Address:</strong> {data.postal_address}
                    </div>
                    <div>
                        <strong>Phone:</strong> {data.phone}
                    </div>
                </div>
            </div>
            <button
                    onClick={handlePrint}
                    style={{
                        marginTop: "10px",
                        padding: "5px 10px",
                        cursor: "pointer",
                    }}
                >
                    <PrintOutlinedIcon /> Print
                </button>

        </div>
    );
};

export default IDCard;
