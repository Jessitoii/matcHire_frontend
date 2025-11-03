import React, { useState } from 'react';

const JobDescriptionForm = ({ onSubmit }) => {
    const [jobDescription, setJobDescription] = useState('');

    const handleChange = (event) => {
        setJobDescription(event.target.value);
    };

    const handleSubmit = (event) => {
        event.preventDefault();
        onSubmit(jobDescription);
    };

    return (
        <form onSubmit={handleSubmit} className="mb-4">
            <textarea
                value={jobDescription}
                onChange={handleChange}
                placeholder="Enter job description"
                className="w-full h-32 p-2 border border-gray-300 rounded"
                required
            />
            <button type="submit" className="mt-2 px-4 py-2 bg-blue-500 text-white rounded">
                Submit Job Description
            </button>
        </form>
    );
};

export default JobDescriptionForm;