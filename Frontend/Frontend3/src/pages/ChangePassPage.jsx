import CreateNewPassForm from "../Components/ProfileNav/CreateNewPassForm/CreateNewPassForm";
import styles from "../styles/ChangePass.module.scss";

const ChangePassPage = () => {
  return (
    <div className={styles.main}>
      <CreateNewPassForm />
    </div>
  );
};

export default ChangePassPage;
