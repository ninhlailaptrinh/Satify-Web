import React, { useState } from "react";
import api from "../api/axiosClient";

interface Props {
    onUploaded?: (url: string) => void;
}

const ImageUploader: React.FC<Props> = ({ onUploaded }) => {
    const [image, setImage] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImage(file);
            setPreview(URL.createObjectURL(file));
        }
    };

    const handleUpload = async () => {
        if (!image) return;
        const formData = new FormData();
        formData.append("image", image);

        try {
            const res = await api.post("/upload", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });
            const url = res.data.imageUrl as string;
            setUploadedUrl(url);
            onUploaded?.(url);
        } catch (err) {
            console.error("Upload failed", err);
        }
    };

    return (
        <div style={{ padding: "20px", maxWidth: "400px" }}>
            <h2>Upload ảnh</h2>
            <input type="file" accept="image/*" onChange={handleFileChange} />
            {preview && <img src={preview} alt="preview" style={{ width: "100%", marginTop: "10px" }} />}
            <button onClick={handleUpload} style={{ marginTop: "10px" }}>Upload</button>
            {uploadedUrl && (
                <div>
                    <p>Ảnh đã upload:</p>
                    <img src={uploadedUrl} alt="uploaded" style={{ width: "100%" }} />
                </div>
            )}
        </div>
    );
};

export default ImageUploader;
