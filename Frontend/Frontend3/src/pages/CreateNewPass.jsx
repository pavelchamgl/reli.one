import CreateNewPassForm from "../Components/ProfileNav/CreateNewPassForm/CreateNewPassForm";
import styles from "../styles/CreateNewwPass.module.scss";

const CreateNewPass = () => {
  return (
    <div className={styles.main}>
      <CreateNewPassForm />
    </div>
  );
};

export default CreateNewPass;
