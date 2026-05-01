import {useNavigate} from "react-router-dom";
import sprintPic from "../assets/Athletics.jpg"; // so that you get the page 

function LearnIntro()   { // the return will have the output like the page 
 const navigate = useNavigate(); // to navigate between pages
 // this is format of the page 
    return(
        <div className="min-h-screen bg-black text-white">
            {/* WINNER*/}
            <div className="relative h-screen">
                <img src={sprintPic} alt="Sprint" 
                className="absolute inset-0 w-full h-full object-cover-70" 
                />
                <div className="relative z-10 flex flex-col justify-center h-full px-8 max-w-3xl">
                    <h1 className="text-6xl font-bold leading-tight">Welcome to Paul's Website</h1>
                    <p>className="text-gray-300 mt-6 text-lg"
                        Website made for people like me 
                        who are tired of losing right? 
                        </p>
                        <div className="flex gap-4 mt-8">   
                            
                            <button

                        
                            onClick={()=>navigate("/register")}
                            className="bg-black -400 px-6 py-3 rounded-lg font-semibold hover:bg-orange-700"
                            >Click me </button>
                            </div>
                </div>
            </div>
                            

                            

                        </div>
      
                    







    );
}
export default LearnIntro;

      



