import { useFormik } from "formik"
import * as Yup from "yup";

import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { createContactMessage } from "../../../api";

import styles from "./MessageForm.module.scss"




const MessageForm = () => {

    const validationSchema = Yup.object({
        first_name: Yup.string().required("First name is required"),
        last_name: Yup.string().required("Last name is required"),
        email: Yup.string().email("Invalid email").required("Email is required"),
        business_type: Yup.string().required("Business type is required"),
        message: Yup.string().required("Message is required"),
    });


    const formik = useFormik({
        initialValues: {
            first_name: "",
            last_name: "",
            email: "",
            business_type: "",
            message: ""

        },
        validationSchema,
        onSubmit: async (values) => {
            try {
                const res = await createContactMessage(values);
                console.log(res);

                toast.success("Message sent successfully!");

            } catch (err) {
                console.log(err);

                toast.error("Failed to send message. Try again.");
            }
        }
    })

    return (
        <form className={styles.form}>
            <h5 className={styles.title}>Send us a Message</h5>

            <div className={styles.formContent}>
                <div className={styles.nameAndLast}>
                    <label className={styles.inpLabel}>
                        <p>First Name</p>
                        <input
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            value={formik.values.first_name}
                            name="first_name"
                            type="text"
                            placeholder="Your first name" />
                        {formik.touched.first_name && formik.errors.first_name && (
                            <span className={styles.error}>{formik.errors.first_name}</span>
                        )}
                    </label>

                    <label className={styles.inpLabel}>
                        <p>Last Name</p>
                        <input
                            name="last_name"
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            value={formik.values.last_name}
                            type="text"
                            placeholder="Your last name" />
                        {formik.touched.last_name && formik.errors.last_name && (
                            <span className={styles.error}>{formik.errors.last_name}</span>
                        )}
                    </label>

                </div>
                <label className={styles.inpLabel}>
                    <p>Email Address</p>
                    <input
                        name="email"
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        value={formik.values.email}
                        type="email"
                        placeholder="your.email@example.com" />
                    {formik.touched.email && formik.errors.email && (
                        <span className={styles.error}>{formik.errors.email}</span>
                    )}
                </label>

                <label className={styles.inpLabel}>
                    <p>Business Type</p>
                    <input
                        name="business_type"
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        value={formik.values.business_type}
                        type="text"
                        placeholder="e.g., Electronics, Fashion, Home & Garden" />
                    {formik.touched.business_type && formik.errors.business_type && (
                        <span className={styles.error}>{formik.errors.business_type}</span>
                    )}
                </label>

                <label className={styles.inpLabel}>
                    <p>Message</p>
                    <textarea
                        name="message"
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        value={formik.values.message}
                        placeholder="Tell us about your business and how we can help..."></textarea>
                    {formik.touched.message && formik.errors.message && (
                        <span className={styles.error}>{formik.errors.message}</span>
                    )}
                </label>

                <button onClick={formik.handleSubmit} className={styles.subBtn}
                    disabled={!formik.dirty || !formik.isValid || formik.isSubmitting}
                >
                    Send Message
                </button>

            </div>


            <ToastContainer position="top-right" autoClose={2000} />

        </form>
    )
}

export default MessageForm