import SignUpForm from "../Components/ProfileNav/SignUp/SignUpForm";
import styles from "../styles/SignUpPage.module.scss";

const SignUpPage = () => {
  return (
    <div className={styles.main}>
      <SignUpForm />
    </div>
  );
};

export default SignUpPage;
