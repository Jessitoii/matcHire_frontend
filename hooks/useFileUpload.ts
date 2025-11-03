import { useState } from 'react';

const useFileUpload = () => {
    const [files, setFiles] = useState<File[]>([]);
    const [error, setError] = useState<string | null>(null);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFiles = event.target.files;
        if (selectedFiles) {
            const fileArray = Array.from(selectedFiles);
            setFiles(fileArray);
            setError(null);
        }
    };

    const removeFile = (fileName: string) => {
        setFiles(prevFiles => prevFiles.filter(file => file.name !== fileName));
    };

    const clearFiles = () => {
        setFiles([]);
    };

    return {
        files,
        error,
        handleFileChange,
        removeFile,
        clearFiles,
    };
};

export default useFileUpload;