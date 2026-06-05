import { useNavigate } from 'react-router-dom';

const BackButton = ({ to }) => {
    const navigate = useNavigate();

    return (
        <button
            onClick={() => navigate(to)}
            className="flex items-center gap-1.5 font-medium text-[#64748B] hover:text-[#3C50E0] transition-colors"
        >
            &larr; Quay lại danh sách
        </button>
    );
};

export default BackButton;