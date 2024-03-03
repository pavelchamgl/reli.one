import cls from './MessageVerify.module.scss'
import { useTranslation } from 'react-i18next'
const MessageVerify: React.FC = () => {
  const {t} = useTranslation('verify')
  return (
    <> 
      <div className= {cls.container}>
      
          <h1>{t('Potvrďte svůj e-mail, byl vám zaslán e-mail')}</h1>
          
      </div>
    </>
  )
}
export default MessageVerify