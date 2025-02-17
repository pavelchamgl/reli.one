<div className="xl:flex items-center">
    {/* Left Section */}
    <div className="mb-6 flex-1 flex-col gap-10">
        <div className="h-[261px] bg-[#F5F5F5] rounded-2xl overflow-hidden">
            <img src={newImage} className="object-cover" alt="Kontakt" />
        </div>
        <div className="hidden h-5 bg-[#FFCC00] rounded-full xl:block"></div>
        <div>
            <p className="text-lg font-bold">Number:</p>
            <div className="mt-4 flex items-center bg-[#F5F5F5] rounded-2xl p-2 px-5">
                <img className='w-10 h-10 mr-4' src={phoneIcon} alt="Phone" />
                <p className="font-medium">+420 797 837 856</p>
            </div>
        </div>
    </div>
    {/* Separator */}
    <div className="mx-16 flex flex-col items-center justify-center">
        <div className="mb-8 h-[45%] w-5 bg-[#FFCC00] rounded-full"></div>
        <div className="mb-8 h-16 w-16 bg-[#FFCC00] rounded-full"></div>
        <div className="h-[45%] w-5 bg-[#FFCC00] rounded-full"></div>
    </div>
    {/* Right Section */}
    <div className="flex-1 flex-col gap-10">
        <div className="flex flex-col items-center gap-5 bg-[#F5F5F5] rounded-2xl py-7 xl:py-12">
            <img src={emailIcon} alt="Email" className="w-12" />
            <p className="text-xl font-bold xl:text-3xl">Email</p>
            <p className="xl:text-xl">info.reli.one@gmail.com</p>
        </div>
        <div className="hidden h-5 bg-[#FFCC00] rounded-full xl:block"></div>
        <div className="flex items-end bg-[#F5F5F5] rounded-2xl p-2 px-5 xl:p-5">
            <div className="mr-3 flex flex-col items-center">
                <p className="text-xl font-bold">Address:</p>
                <img src={addressIcon} className="w-10" alt="Address" />
            </div>
            <p className="xl:text-lg">
                Na Lysinách 551/34, Praha 4 - Hodkovičky, PSČ 147 00
            </p>
        </div>
    </div>
</div>

width: 442px;
height: 139px;

