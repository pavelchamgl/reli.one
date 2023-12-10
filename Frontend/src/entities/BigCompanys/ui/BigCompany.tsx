import { InputCustom, InputState } from 'share/ui/InputCustom/ui/InputCustom'
import cls from './ProjectKey.module.scss'
import { ButtonCustom } from 'share/ui/ButtonCustom'
import { ButtonCustomState } from 'share/ui/ButtonCustom/ui/ButtonCustom'
import { useCallback } from 'react'
import { useSelector } from 'react-redux'
import { getFormBigComapny } from '../models/selectorBigCompany'
import { useAppDispatch } from 'share/libs/useRedux/useRedux'
import { setAdresse, setCompanyName, setEmail, setMessage, setPhone } from '../models/sliceBigCompany'
import { setName } from 'entities/Name'
import { sendBigCompany } from '../models/actions/sendProjectKey'
import { ReduxProvider } from 'app/providers/Redux/ui/ReduxProvider'

 const BigCompany: React.FC = () => {
    const form = useSelector(getFormBigComapny)
    const dispatch = useAppDispatch()
    const changeEmail = useCallback((e: string) => {
        dispatch(setEmail(e))
    }, [form?.email])
    const changeAdresse = useCallback((e: string) => {
        dispatch(setAdresse(e))
    }, [form?.address])
    const changePhone = useCallback((e: string) => {
        dispatch(setPhone(e))
    }, [form?.phone])
    const changeCompanyName = useCallback((e: string) => {
        dispatch(setCompanyName(e))
    }, [form?.company_name])
    const changeMessage = useCallback((e: string) => {
        dispatch(setMessage(e))
    }, [form?.message])
    const changeName = useCallback((e: string) => {
        dispatch(setName(e))
    }, [form?.name])

    const clickHandler = useCallback(() => {
          dispatch(sendBigCompany(form))
    }, [form])

   
    return(<>
    <div className= {cls.mainContainer}>
    <h1>Velkým společnostem</h1>
     <div className= {cls.formContainer}>
      <div className= {cls.InnerContainer}>
      <div className= {cls.column}>
        <label htmlFor="field1">Jméno a příjmení*</label>
        <InputCustom value= {form?.name} onChange={changeName} classe= {cls.InputCustom} state= {InputState.INPUTFORM} />
      </div>
      <div className= {cls.column}>
        <label htmlFor="field2">Telefon*</label>
        <InputCustom value= {form?.phone}  onChange={changePhone} state= {InputState.INPUTFORM} />
      </div>
      <div className= {cls.column}>
        <label htmlFor="field3">Еmail*</label>
        <InputCustom value= {form?.email} onChange={changeEmail} state= {InputState.INPUTFORM} />
      </div>
     </div>
      
     <div className= {cls.InnerContainer}>
      <div className= {cls.column}>
        <label htmlFor="field1">Adresa* </label>
        <InputCustom value= {form?.address} onChange={changeAdresse} classe= {cls.InputCustom} state= {InputState.INPUTFORM} />
      </div>
      <div className= {cls.column}>
        <label htmlFor="field2">Název společnosti </label>
        <InputCustom value= {form?.company_name} onChange={changeCompanyName} state= {InputState.INPUTFORM} />
      </div>
      <div className= {cls.column}>
        <label htmlFor="field3">Zpráva </label>
        <InputCustom value= {form?.message} onChange={changeMessage} classe= {cls.TextInput} inputMode= 'text' state= {InputState.INPUTFORM } />
      </div>
     </div>
     </div>
     <ButtonCustom onClick={clickHandler}  classes= {cls.ButtonCustom} state= {ButtonCustomState.BUTTONMODAL}>Zanechat požadavek</ButtonCustom>
    </div>

      
  
    
    </>)
}


export default BigCompany