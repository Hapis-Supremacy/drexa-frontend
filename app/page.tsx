import { li } from "motion/react-m";
import Image from "next/image";

import RegisterPage from "./auth/register/page";
import LoginPage from "./auth/login/page";
import EmailVerificationPage from "./auth/register/email_verification/page";
import IdentityVerificationPage from "./auth/register/identity_verification/page";
import RegistrationDetailsPage from "./auth/register/registration_details/page";
import ForgotPasswordPage from "./auth/login/forgot_password/page";
import ResetPasswordPage from "./auth/login/reset_password/page";
import LoginFilledPage from "./auth/login/login_filled/page";
import RegistrationCompletePage from "./auth/register/register_complete/page";
import IdentityFacePage from "./auth/register/identity_face/page";

export default function Home() {
  return (
    <LoginPage />
  );
}
