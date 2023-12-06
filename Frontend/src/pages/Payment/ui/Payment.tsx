import { InputCustom, InputState } from 'share/ui/InputCustom/ui/InputCustom'
import cls from './Payment.module.scss'
const Payment: React.FC = () => {
  return (
    <> 
    <h1>Solopharma Group s.r.o</h1>
      <div className= {cls.container}>
        <div className= {cls.InputContainer}>
         <p>Еmail</p>
         <InputCustom state= {InputState.INPUTPAYMENT}/>
        </div>
        <h2>Dodací adresa</h2>
        <div className= {cls.InputContainer}>
         <p>Země/oblast</p>
         <InputCustom state= {InputState.INPUTPAYMENT}/>
        </div>

        
        <div className= {cls.dContainer}>
            <div>
            <p>Jméno</p>
            <InputCustom state= {InputState.INPUTPAYMENT}/>
            </div>
       
            <div>
            <p>Příjmení</p>
            <InputCustom classe= {cls.inputDisplay} state= {InputState.INPUTPAYMENT}/>
            </div>

        </div>


        <div className= {cls.InputContainer}>
         <p>Adresa </p>
         <InputCustom state= {InputState.INPUTPAYMENT}/>
        </div>



        <div className= {cls.InputContainer} >
         <p>Telefon </p>
         <InputCustom state= {InputState.INPUTPAYMENT}/>
        </div>
          
      </div>
    </>
  )
}
export default Payment