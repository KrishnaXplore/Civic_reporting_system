const Toast = ({ toast }) => {
  if (!toast?.text) return null;

  const isSuccess = toast.type === 'success';

  return (
    <div style={{
      padding: '12px 16px',
      borderRadius: 10,
      marginBottom: 20,
      fontSize: 13,
      fontWeight: 500,
      background: isSuccess ? '#F0FDF4' : '#FFF1F2',
      color: isSuccess ? '#15803D' : '#BE123C',
      border: `1px solid ${isSuccess ? '#BBF7D0' : '#FECDD3'}`,
    }}>
      {toast.text}
    </div>
  );
};

export default Toast;
