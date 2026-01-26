/**
 * Seed script for training examples
 * Run with: pnpm tsx --env-file=.env.local scripts/seed-training-data.ts
 * 
 * Note: This script requires the database to be set up and Prisma client to be generated
 */

import 'dotenv/config'
import { prisma } from '../lib/db'
import { parseWithCustomModel } from '../lib/custom-parser'
import { ParsedDonorData } from '../lib/parser'

// All 80+ training examples from user
const trainingExamples = [
  {
    rawText: "Sona mia vai\nO+\n01955-198724\n18-9-25",
    expectedOutput: {
      name: "Sona mia vai",
      bloodGroup: "O+",
      phone: "01955198724",
      date: "18-09-2025",
      batch: "Unknown",
      hospital: "Unknown",
      referrer: "",
      hallName: "",
    } as ParsedDonorData,
  },
  {
    rawText: "Maruf\n+8801521712737\nB+\n25/1/2026",
    expectedOutput: {
      name: "Maruf",
      bloodGroup: "B+",
      phone: "01521712737",
      date: "25-01-2026",
      batch: "Unknown",
      hospital: "Unknown",
      referrer: "",
      hallName: "",
    } as ParsedDonorData,
  },
  {
    rawText: "Notun\nA+\nBotany\n+8801572900533\n20-01-2026",
    expectedOutput: {
      name: "Notun",
      bloodGroup: "A+",
      phone: "01572900533",
      date: "20-01-2026",
      batch: "Botany",
      hospital: "Unknown",
      referrer: "",
      hallName: "",
    } as ParsedDonorData,
  },
  {
    rawText: "Nazmus Shakib\nB(-)ve\nBotany\nSH hall\n+8801609-852200\n25-01-2026",
    expectedOutput: {
      name: "Nazmus Shakib",
      bloodGroup: "B-",
      phone: "01609852200",
      date: "25-01-2026",
      batch: "Botany",
      hospital: "Unknown",
      referrer: "",
      hallName: "SH hall",
    } as ParsedDonorData,
  },
  {
    rawText: "Miskatul\nO+\nMath 23-24\nA.E Hall\n01969013359\n25.01.26\nFirst time",
    expectedOutput: {
      name: "Miskatul",
      bloodGroup: "O+",
      phone: "01969013359",
      date: "25-01-2026",
      batch: "Math 23-24",
      hospital: "Unknown",
      referrer: "",
      hallName: "A.E Hall",
    } as ParsedDonorData,
  },
  {
    rawText: "Safwan\nAb-\nAe hall\n24-25\n+8801601141106\n25-01-26",
    expectedOutput: {
      name: "Safwan",
      bloodGroup: "AB-",
      phone: "01601141106",
      date: "25-01-2026",
      batch: "24-25",
      hospital: "Unknown",
      referrer: "",
      hallName: "Ae hall",
    } as ParsedDonorData,
  },
  {
    rawText: "Riaz(A+)\nMobile:01572933123\nManaged by Monowarul Islam\nDate:25-01-2026",
    expectedOutput: {
      name: "Riaz",
      bloodGroup: "A+",
      phone: "01572933123",
      date: "25-01-2026",
      batch: "Unknown",
      hospital: "Unknown",
      referrer: "Monowarul Islam",
      hallName: "",
    } as ParsedDonorData,
  },
  {
    rawText: "Unknown\nB+\n+8801782539820\n25-01-26",
    expectedOutput: {
      name: "Unknown",
      bloodGroup: "B+",
      phone: "01782539820",
      date: "25-01-2026",
      batch: "Unknown",
      hospital: "Unknown",
      referrer: "",
      hallName: "",
    } as ParsedDonorData,
  },
  {
    rawText: "সানি ভাই\nB+\n+8801317095040\n25-01-26",
    expectedOutput: {
      name: "সানি ভাই",
      bloodGroup: "B+",
      phone: "01317095040",
      date: "25-01-2026",
      batch: "Unknown",
      hospital: "Unknown",
      referrer: "",
      hallName: "",
    } as ParsedDonorData,
  },
  {
    rawText: "Abdur Rahman\nB+\n1st time\nAmar Ekushey Hall\nPHR(24-25)\n+8801540749949\n25-01-2026",
    expectedOutput: {
      name: "Abdur Rahman",
      bloodGroup: "B+",
      phone: "01540749949",
      date: "25-01-2026",
      batch: "PHR(24-25)",
      hospital: "Unknown",
      referrer: "",
      hallName: "Amar Ekushey Hall",
    } as ParsedDonorData,
  },
  {
    rawText: "Donor Name: Billal\nBlood Group: B+\nBatch:\nHospital: PG hospital\nPhone: 01869210760\nDate:2 5-01-26\nReferrer: Abdul Ahad\nLocation:Sonir Akhra",
    expectedOutput: {
      name: "Billal",
      bloodGroup: "B+",
      phone: "01869210760",
      date: "25-01-2026",
      batch: "Unknown",
      hospital: "PG hospital",
      referrer: "Abdul Ahad",
      hallName: "",
    } as ParsedDonorData,
  },
  {
    rawText: "Donor Name: Ratno dip\nBlood Group: Ab+\nBatch:Math 21-22\nHospital: CMH\nPhone: 01749165993\nDate: 24-01-26\nReferrer: Hasanur\nHall Name: Jagannath hall",
    expectedOutput: {
      name: "Ratno dip",
      bloodGroup: "AB+",
      phone: "01749165993",
      date: "24-01-2026",
      batch: "Math 21-22",
      hospital: "CMH",
      referrer: "Hasanur",
      hallName: "Jagannath hall",
    } as ParsedDonorData,
  },
  {
    rawText: "atiq\nab+\n01779799243\n10/1/26",
    expectedOutput: {
      name: "atiq",
      bloodGroup: "AB+",
      phone: "01779799243",
      date: "10-01-2026",
      batch: "Unknown",
      hospital: "Unknown",
      referrer: "",
      hallName: "",
    } as ParsedDonorData,
  },
  {
    rawText: "Abdul\nMaruf,B+\n21-21\nAEH\n+880 1521-712737\n22/01/26",
    expectedOutput: {
      name: "Maruf",
      bloodGroup: "B+",
      phone: "01521712737",
      date: "22-01-2026",
      batch: "21-21",
      hospital: "Unknown",
      referrer: "Abdul",
      hallName: "AEH",
    } as ParsedDonorData,
  },
  {
    rawText: "Ismail\nMd. Ismail Hossen\nB+\n01993604029\n5th time\n13/12/2025",
    expectedOutput: {
      name: "Md. Ismail Hossen",
      bloodGroup: "B+",
      phone: "01993604029",
      date: "13-12-2025",
      batch: "Unknown",
      hospital: "Unknown",
      referrer: "Ismail",
      hallName: "",
    } as ParsedDonorData,
  },
  {
    rawText: "Abdur\nMD Azahar Uddin\nO+\n+8801960006807\n22/1/26",
    expectedOutput: {
      name: "MD Azahar Uddin",
      bloodGroup: "O+",
      phone: "01960006807",
      date: "22-01-2026",
      batch: "Unknown",
      hospital: "Unknown",
      referrer: "Abdur",
      hallName: "",
    } as ParsedDonorData,
  },
  {
    rawText: "Md Rowshon\n+8801787048350\nAB+\nTokir vai\n04-01-2026",
    expectedOutput: {
      name: "Md Rowshon",
      bloodGroup: "AB+",
      phone: "01787048350",
      date: "04-01-2026",
      batch: "Unknown",
      hospital: "Unknown",
      referrer: "Tokir vai",
      hallName: "",
    } as ParsedDonorData,
  },
  {
    rawText: "Md Rowshon\n+8801819794712\nB+\nরাসেল ভাই\nDhanmondi\n04-01-2026",
    expectedOutput: {
      name: "Md Rowshon",
      bloodGroup: "B+",
      phone: "01819794712",
      date: "04-01-2026",
      batch: "Unknown",
      hospital: "Dhanmondi",
      referrer: "রাসেল ভাই",
      hallName: "",
    } as ParsedDonorData,
  },
  {
    rawText: "Edited\n+8801617336889\nA-\nOrna apu\nDMC\n05-01-2026",
    expectedOutput: {
      name: "Unknown",
      bloodGroup: "A-",
      phone: "01617336889",
      date: "05-01-2026",
      batch: "Unknown",
      hospital: "DMC",
      referrer: "Orna apu",
      hallName: "",
    } as ParsedDonorData,
  },
  {
    rawText: "Md Rowshon\n+8801752146391\nB+\nAzmin vai\nBurn\n04-01-2026",
    expectedOutput: {
      name: "Md Rowshon",
      bloodGroup: "B+",
      phone: "01752146391",
      date: "04-01-2026",
      batch: "Unknown",
      hospital: "Burn",
      referrer: "Azmin vai",
      hallName: "",
    } as ParsedDonorData,
  },
  {
    rawText: "Tanvir Ahmed\nSabbir\nAB+\nCanteen boy\nAEH\n01540517307\n04.01.26",
    expectedOutput: {
      name: "Sabbir",
      bloodGroup: "AB+",
      phone: "01540517307",
      date: "04-01-2026",
      batch: "Unknown",
      hospital: "Unknown",
      referrer: "Tanvir Ahmed",
      hallName: "AEH",
    } as ParsedDonorData,
  },
  {
    rawText: "Tanvir Ahmed\nLikhon vai\nB+\nAE hall\n+8801595692202\n04.01.2026",
    expectedOutput: {
      name: "Likhon vai",
      bloodGroup: "B+",
      phone: "01595692202",
      date: "04-01-2026",
      batch: "Unknown",
      hospital: "Unknown",
      referrer: "Tanvir Ahmed",
      hallName: "AE hall",
    } as ParsedDonorData,
  },
  {
    rawText: "Tanvir Ahmed\nTalal Tahmid\nPharmacy\nO+\n24-25\nA.E Hall\n01572451719\n4.01.26",
    expectedOutput: {
      name: "Talal Tahmid",
      bloodGroup: "O+",
      phone: "01572451719",
      date: "04-01-2026",
      batch: "Pharmacy 24-25",
      hospital: "Unknown",
      referrer: "Tanvir Ahmed",
      hallName: "A.E Hall",
    } as ParsedDonorData,
  },
  {
    rawText: "Tanvir Ahmed\nZawad ahmed\nB+\n24-25\n01718521667\n4.01.26",
    expectedOutput: {
      name: "Zawad ahmed",
      bloodGroup: "B+",
      phone: "01718521667",
      date: "04-01-2026",
      batch: "24-25",
      hospital: "Unknown",
      referrer: "Tanvir Ahmed",
      hallName: "",
    } as ParsedDonorData,
  },
  {
    rawText: "Md Rowshon\nSaiful Islam Vai,\nO+\nDMC\n04-01-2026\n+8801724750879",
    expectedOutput: {
      name: "Saiful Islam Vai",
      bloodGroup: "O+",
      phone: "01724750879",
      date: "04-01-2026",
      batch: "Unknown",
      hospital: "DMC",
      referrer: "Md Rowshon",
      hallName: "",
    } as ParsedDonorData,
  },
  {
    rawText: "Md Rowshon\nMofijur Rahman Nayem Vai,\nVice President Badhon AE Hall Unit, 26th Committee,\nB+\n04-01-2026\n+8801516584795",
    expectedOutput: {
      name: "Mofijur Rahman Nayem Vai",
      bloodGroup: "B+",
      phone: "01516584795",
      date: "04-01-2026",
      batch: "Vice President Badhon AE Hall Unit, 26th Committee",
      hospital: "Unknown",
      referrer: "Md Rowshon",
      hallName: "",
    } as ParsedDonorData,
  },
  {
    rawText: "Md Rowshon\nUtjjol vai\nAB+\n04-01-2026\n+8801619450189",
    expectedOutput: {
      name: "Utjjol vai",
      bloodGroup: "AB+",
      phone: "01619450189",
      date: "04-01-2026",
      batch: "Unknown",
      hospital: "Unknown",
      referrer: "Md Rowshon",
      hallName: "",
    } as ParsedDonorData,
  },
  {
    rawText: "Md Rowshon\nOliullah vai\nO+\n04-01-2026\n+880193308916",
    expectedOutput: {
      name: "Oliullah vai",
      bloodGroup: "O+",
      phone: "0193308916",
      date: "04-01-2026",
      batch: "Unknown",
      hospital: "Unknown",
      referrer: "Md Rowshon",
      hallName: "",
    } as ParsedDonorData,
  },
  {
    rawText: "Tanvir Ahmed\nRakib vai\nAB+\nP.G hospital\n05.01.2026\n01731-729431",
    expectedOutput: {
      name: "Rakib vai",
      bloodGroup: "AB+",
      phone: "01731729431",
      date: "05-01-2026",
      batch: "Unknown",
      hospital: "P.G hospital",
      referrer: "Tanvir Ahmed",
      hallName: "",
    } as ParsedDonorData,
  },
  {
    rawText: "Saifullah\nArafat\nAB(+)ve\n17-12-25\n01637234096",
    expectedOutput: {
      name: "Arafat",
      bloodGroup: "AB+",
      phone: "01637234096",
      date: "17-12-2025",
      batch: "Unknown",
      hospital: "Unknown",
      referrer: "Saifullah",
      hallName: "",
    } as ParsedDonorData,
  },
  {
    rawText: "Abdur\nSojib\nAB+\n15-12-25\n01777967666",
    expectedOutput: {
      name: "Sojib",
      bloodGroup: "AB+",
      phone: "01777967666",
      date: "15-12-2025",
      batch: "Unknown",
      hospital: "Unknown",
      referrer: "Abdur",
      hallName: "",
    } as ParsedDonorData,
  },
  {
    rawText: "Saifullah\nbubel\nab+\n31-11-25\n01742498137",
    expectedOutput: {
      name: "bubel",
      bloodGroup: "AB+",
      phone: "01742498137",
      date: "31-11-2025",
      batch: "Unknown",
      hospital: "Unknown",
      referrer: "Saifullah",
      hallName: "",
    } as ParsedDonorData,
  },
  {
    rawText: "MD Abdul\nAsraf\nB(+)\n4/1/26\n+8801576690638",
    expectedOutput: {
      name: "Asraf",
      bloodGroup: "B+",
      phone: "01576690638",
      date: "04-01-2026",
      batch: "Unknown",
      hospital: "Unknown",
      referrer: "MD Abdul",
      hallName: "",
    } as ParsedDonorData,
  },
  {
    rawText: "Abdur\nSelim\nA+\nAe hall\n21-22\n22-12-25\n+8801576566576",
    expectedOutput: {
      name: "Selim",
      bloodGroup: "A+",
      phone: "01576566576",
      date: "22-12-2025",
      batch: "21-22",
      hospital: "Unknown",
      referrer: "Abdur",
      hallName: "Ae hall",
    } as ParsedDonorData,
  },
  {
    rawText: "Saifullah replied to Sumon\nbubel\nab+\n24-12-25\n01742498137",
    expectedOutput: {
      name: "bubel",
      bloodGroup: "AB+",
      phone: "01742498137",
      date: "24-12-2025",
      batch: "Unknown",
      hospital: "Unknown",
      referrer: "Saifullah",
      hallName: "",
    } as ParsedDonorData,
  },
  {
    rawText: "Edited\nSajidul islam\nA+\n2-1-26\n017 5626 7599",
    expectedOutput: {
      name: "Sajidul islam",
      bloodGroup: "A+",
      phone: "01756267599",
      date: "02-01-2026",
      batch: "Unknown",
      hospital: "Unknown",
      referrer: "",
      hallName: "",
    } as ParsedDonorData,
  },
  {
    rawText: "Managed by:Saifullah Hossain(23-24), Sumon\nEmon\nOcn\nO+\n20-12-25\n+880 1511-831538",
    expectedOutput: {
      name: "Emon",
      bloodGroup: "O+",
      phone: "01511831538",
      date: "20-12-2025",
      batch: "Ocn",
      hospital: "Unknown",
      referrer: "Saifullah Hossain, Sumon",
      hallName: "",
    } as ParsedDonorData,
  },
  {
    rawText: "Sumon\nAraf vai\nA+\nChemistry\n01518-983188\n26-12-25",
    expectedOutput: {
      name: "Araf vai",
      bloodGroup: "A+",
      phone: "01518983188",
      date: "26-12-2025",
      batch: "Chemistry",
      hospital: "Unknown",
      referrer: "Sumon",
      hallName: "",
    } as ParsedDonorData,
  },
  {
    rawText: "Sumon\nFahim vai\nB+\n+880 1576-592101\n5-12-25",
    expectedOutput: {
      name: "Fahim vai",
      bloodGroup: "B+",
      phone: "01576592101",
      date: "05-12-2025",
      batch: "Unknown",
      hospital: "Unknown",
      referrer: "Sumon",
      hallName: "",
    } as ParsedDonorData,
  },
  {
    rawText: "Sumon\nSohidullah vai\nO+\n+880 1881-311603\n26-12-25",
    expectedOutput: {
      name: "Sohidullah vai",
      bloodGroup: "O+",
      phone: "01881311603",
      date: "26-12-2025",
      batch: "Unknown",
      hospital: "Unknown",
      referrer: "Sumon",
      hallName: "",
    } as ParsedDonorData,
  },
  {
    rawText: "Sumon\nEmon vai\nChankarpul\n+8801521114544\nB+\n24-\t12-25",
    expectedOutput: {
      name: "Emon vai",
      bloodGroup: "B+",
      phone: "01521114544",
      date: "24-12-2025",
      batch: "Unknown",
      hospital: "Chankarpul",
      referrer: "Sumon",
      hallName: "",
    } as ParsedDonorData,
  },
  {
    rawText: "Sumon\nRomjan\nAb+\nSWE\n01310-026538\n25-12-25",
    expectedOutput: {
      name: "Romjan",
      bloodGroup: "AB+",
      phone: "01310026538",
      date: "25-12-2025",
      batch: "SWE",
      hospital: "Unknown",
      referrer: "Sumon",
      hallName: "",
    } as ParsedDonorData,
  },
  {
    rawText: "Sumon\nShihab\nO+\nA.math\n+8801768510309\n25-12-25",
    expectedOutput: {
      name: "Shihab",
      bloodGroup: "O+",
      phone: "01768510309",
      date: "25-12-2025",
      batch: "A.math",
      hospital: "Unknown",
      referrer: "Sumon",
      hallName: "",
    } as ParsedDonorData,
  },
  {
    rawText: "Hasanur\nPromit\nO+\nMath\nJn hall\n+8801767486049\n28-12-25",
    expectedOutput: {
      name: "Promit",
      bloodGroup: "O+",
      phone: "01767486049",
      date: "28-12-2025",
      batch: "Math",
      hospital: "Unknown",
      referrer: "Hasanur",
      hallName: "Jn hall",
    } as ParsedDonorData,
  },
  {
    rawText: "Hasanur,\nHasanur\nO+\nAe hall\n01581720110\n28-12-25",
    expectedOutput: {
      name: "Hasanur",
      bloodGroup: "O+",
      phone: "01581720110",
      date: "28-12-2025",
      batch: "Unknown",
      hospital: "Unknown",
      referrer: "",
      hallName: "Ae hall",
    } as ParsedDonorData,
  },
  {
    rawText: "Md Rowshon\nApon\nAB+\nAE\n+8801409839608\n28-12-2025",
    expectedOutput: {
      name: "Apon",
      bloodGroup: "AB+",
      phone: "01409839608",
      date: "28-12-2025",
      batch: "Unknown",
      hospital: "Unknown",
      referrer: "Md Rowshon",
      hallName: "AE",
    } as ParsedDonorData,
  },
  {
    rawText: "Sumon\nSohan\nA+\n23-24\n01568-268674\n24-12-25",
    expectedOutput: {
      name: "Sohan",
      bloodGroup: "A+",
      phone: "01568268674",
      date: "24-12-2025",
      batch: "23-24",
      hospital: "Unknown",
      referrer: "Sumon",
      hallName: "",
    } as ParsedDonorData,
  },
  {
    rawText: "Sumon\nMahadin\nB+\nMath\n25-12-24\n+8801643429914",
    expectedOutput: {
      name: "Mahadin",
      bloodGroup: "B+",
      phone: "01643429914",
      date: "25-12-2024",
      batch: "Math",
      hospital: "Unknown",
      referrer: "Sumon",
      hallName: "",
    } as ParsedDonorData,
  },
  {
    rawText: "Md Rowshon\nIstiak Vai\nAB+\n+8801647706123\n28-12-2025",
    expectedOutput: {
      name: "Istiak Vai",
      bloodGroup: "AB+",
      phone: "01647706123",
      date: "28-12-2025",
      batch: "Unknown",
      hospital: "Unknown",
      referrer: "Md Rowshon",
      hallName: "",
    } as ParsedDonorData,
  },
  {
    rawText: "Tanjim Uddin\nSagor\nO(-ve)\n01728940600\n21.12.25\nDMC",
    expectedOutput: {
      name: "Sagor",
      bloodGroup: "O-",
      phone: "01728940600",
      date: "21-12-2025",
      batch: "Unknown",
      hospital: "DMC",
      referrer: "Tanjim Uddin",
      hallName: "",
    } as ParsedDonorData,
  },
  {
    rawText: "Unknown\nB(+ve)\n01953382419\n21.12.25\nDMC",
    expectedOutput: {
      name: "Unknown",
      bloodGroup: "B+",
      phone: "01953382419",
      date: "21-12-2025",
      batch: "Unknown",
      hospital: "DMC",
      referrer: "",
      hallName: "",
    } as ParsedDonorData,
  },
  {
    rawText: "AE hall, Sumon\nMahbur vai\nA+ platelet\n+880 1521-703096\n21-12-25",
    expectedOutput: {
      name: "Mahbur vai",
      bloodGroup: "A+",
      phone: "01521703096",
      date: "21-12-2025",
      batch: "Unknown",
      hospital: "Unknown",
      referrer: "Sumon",
      hallName: "AE hall",
    } as ParsedDonorData,
  },
  {
    rawText: "Md Rowshon\nShad\nB(-ve)\nApplied math\nA.E Hall\n21-12-25\n+8801522117508",
    expectedOutput: {
      name: "Shad",
      bloodGroup: "B-",
      phone: "01522117508",
      date: "21-12-2025",
      batch: "Applied math",
      hospital: "Unknown",
      referrer: "Md Rowshon",
      hallName: "A.E Hall",
    } as ParsedDonorData,
  },
  {
    rawText: "মোঃ রাজা\nHasib\nO-\n01621171717\n21/12/2025",
    expectedOutput: {
      name: "Hasib",
      bloodGroup: "O-",
      phone: "01621171717",
      date: "21-12-2025",
      batch: "Unknown",
      hospital: "Unknown",
      referrer: "মোঃ রাজা",
      hallName: "",
    } as ParsedDonorData,
  },
  {
    rawText: "মোঃ রাজা\nMotalleb\nA-\n01726-481809\n21/12/2025",
    expectedOutput: {
      name: "Motalleb",
      bloodGroup: "A-",
      phone: "01726481809",
      date: "21-12-2025",
      batch: "Unknown",
      hospital: "Unknown",
      referrer: "মোঃ রাজা",
      hallName: "",
    } as ParsedDonorData,
  },
  {
    rawText: "মোঃ রাজা\nToru\nA+\n01518-600112\n21/12/2025",
    expectedOutput: {
      name: "Toru",
      bloodGroup: "A+",
      phone: "01518600112",
      date: "21-12-2025",
      batch: "Unknown",
      hospital: "Unknown",
      referrer: "মোঃ রাজা",
      hallName: "",
    } as ParsedDonorData,
  },
  {
    rawText: "মোঃ রাজা\nAsraful\nA-\n01727-859818\n21/12/2025",
    expectedOutput: {
      name: "Asraful",
      bloodGroup: "A-",
      phone: "01727859818",
      date: "21-12-2025",
      batch: "Unknown",
      hospital: "Unknown",
      referrer: "মোঃ রাজা",
      hallName: "",
    } as ParsedDonorData,
  },
  {
    rawText: "মোঃ রাজা\nRaka Apu\nA+\n01577-099880\n21/12/2025",
    expectedOutput: {
      name: "Raka Apu",
      bloodGroup: "A+",
      phone: "01577099880",
      date: "21-12-2025",
      batch: "Unknown",
      hospital: "Unknown",
      referrer: "মোঃ রাজা",
      hallName: "",
    } as ParsedDonorData,
  },
  {
    rawText: "মোঃ রাজা\nAlomgir\nA+\n01710-588377\n21/12/2025",
    expectedOutput: {
      name: "Alomgir",
      bloodGroup: "A+",
      phone: "01710588377",
      date: "21-12-2025",
      batch: "Unknown",
      hospital: "Unknown",
      referrer: "মোঃ রাজা",
      hallName: "",
    } as ParsedDonorData,
  },
  {
    rawText: "Sumon\nMazharul vai\nA+\n+8801533867118\n9-12-25",
    expectedOutput: {
      name: "Mazharul vai",
      bloodGroup: "A+",
      phone: "01533867118",
      date: "09-12-2025",
      batch: "Unknown",
      hospital: "Unknown",
      referrer: "Sumon",
      hallName: "",
    } as ParsedDonorData,
  },
  {
    rawText: "Sumon\nMaruf\nB+\nSH\n+880 1540-333108\n10-12-25",
    expectedOutput: {
      name: "Maruf",
      bloodGroup: "B+",
      phone: "01540333108",
      date: "10-12-2025",
      batch: "Unknown",
      hospital: "Unknown",
      referrer: "Sumon",
      hallName: "SH",
    } as ParsedDonorData,
  },
  {
    rawText: "Hasanur\nSifat\nO+\nSwe\n01893443282\n20-12-25",
    expectedOutput: {
      name: "Sifat",
      bloodGroup: "O+",
      phone: "01893443282",
      date: "20-12-2025",
      batch: "Swe",
      hospital: "Unknown",
      referrer: "Hasanur",
      hallName: "",
    } as ParsedDonorData,
  },
  {
    rawText: "Hasanur\nRafid vai\nO+\nIIT\n+8801521784660\n15-12-25",
    expectedOutput: {
      name: "Rafid vai",
      bloodGroup: "O+",
      phone: "01521784660",
      date: "15-12-2025",
      batch: "IIT",
      hospital: "Unknown",
      referrer: "Hasanur",
      hallName: "",
    } as ParsedDonorData,
  },
  {
    rawText: "Hasanur\nSobuj vai\nA+(platelet)\nAe hall\n01568515536\n30-11-25",
    expectedOutput: {
      name: "Sobuj vai",
      bloodGroup: "A+",
      phone: "01568515536",
      date: "30-11-2025",
      batch: "Unknown",
      hospital: "Unknown",
      referrer: "Hasanur",
      hallName: "Ae hall",
    } as ParsedDonorData,
  },
  {
    rawText: "Hasanur\nJauyad shikdar\nB+\nSurjasen hall\n+8801819044326\n26-11-25",
    expectedOutput: {
      name: "Jauyad shikdar",
      bloodGroup: "B+",
      phone: "01819044326",
      date: "26-11-2025",
      batch: "Unknown",
      hospital: "Unknown",
      referrer: "Hasanur",
      hallName: "Surjasen hall",
    } as ParsedDonorData,
  },
  {
    rawText: "Sumon\nSalman\nO+\nSwe\n+880 1403-874684\n10-12-25",
    expectedOutput: {
      name: "Salman",
      bloodGroup: "O+",
      phone: "01403874684",
      date: "10-12-2025",
      batch: "Swe",
      hospital: "Unknown",
      referrer: "Sumon",
      hallName: "",
    } as ParsedDonorData,
  },
  {
    rawText: "Sumon\nNakib\nA+\n+8801902940492\n21-12-25",
    expectedOutput: {
      name: "Nakib",
      bloodGroup: "A+",
      phone: "01902940492",
      date: "21-12-2025",
      batch: "Unknown",
      hospital: "Unknown",
      referrer: "Sumon",
      hallName: "",
    } as ParsedDonorData,
  },
  {
    rawText: "Sumon\nRobiul bhai\nAEH badhan Adviser\nPhysics\nB+ platelet\n19time\n10-12-25\n+880 1568-948242",
    expectedOutput: {
      name: "Robiul bhai",
      bloodGroup: "B+",
      phone: "01568948242",
      date: "10-12-2025",
      batch: "Physics",
      hospital: "Unknown",
      referrer: "Sumon",
      hallName: "AEH",
    } as ParsedDonorData,
  },
  {
    rawText: "Sumon\nNahid hasan nirob vai\nO+\n01641660204\n8-12-25",
    expectedOutput: {
      name: "Nahid hasan nirob vai",
      bloodGroup: "O+",
      phone: "01641660204",
      date: "08-12-2025",
      batch: "Unknown",
      hospital: "Unknown",
      referrer: "Sumon",
      hallName: "",
    } as ParsedDonorData,
  },
  {
    rawText: "Sumon\nAshik\nMath\nA+\n+8801576452364\n13-12-25",
    expectedOutput: {
      name: "Ashik",
      bloodGroup: "A+",
      phone: "01576452364",
      date: "13-12-2025",
      batch: "Math",
      hospital: "Unknown",
      referrer: "Sumon",
      hallName: "",
    } as ParsedDonorData,
  },
  {
    rawText: "Sumon\nAbid bhai\nMicrobiology\nA+\n+8801779352854\n13-12-25",
    expectedOutput: {
      name: "Abid bhai",
      bloodGroup: "A+",
      phone: "01779352854",
      date: "13-12-2025",
      batch: "Microbiology",
      hospital: "Unknown",
      referrer: "Sumon",
      hallName: "",
    } as ParsedDonorData,
  },
  {
    rawText: "Sumon\nMiraj\nB+\nPhy\n+880 1615-647545\n20-12-25",
    expectedOutput: {
      name: "Miraj",
      bloodGroup: "B+",
      phone: "01615647545",
      date: "20-12-2025",
      batch: "Phy",
      hospital: "Unknown",
      referrer: "Sumon",
      hallName: "",
    } as ParsedDonorData,
  },
  {
    rawText: "Sumon\nSohan vai\nAb+\nPhy\n01575-700657\n13-12-25",
    expectedOutput: {
      name: "Sohan vai",
      bloodGroup: "AB+",
      phone: "01575700657",
      date: "13-12-2025",
      batch: "Phy",
      hospital: "Unknown",
      referrer: "Sumon",
      hallName: "",
    } as ParsedDonorData,
  },
  {
    rawText: "Md Rowshon\n+8801522119639\nArafat vai\nJnU, Badhon Secretary\n17-18 session\nAB+\n17-12-2025",
    expectedOutput: {
      name: "Arafat vai",
      bloodGroup: "AB+",
      phone: "01522119639",
      date: "17-12-2025",
      batch: "17-18 session",
      hospital: "Unknown",
      referrer: "Md Rowshon",
      hallName: "",
    } as ParsedDonorData,
  },
  {
    rawText: "Tanjim Uddin\nSahed\nPhysics\nAE hall\n22-23\nB+\n01316257232\n17.12.24",
    expectedOutput: {
      name: "Sahed",
      bloodGroup: "B+",
      phone: "01316257232",
      date: "17-12-2024",
      batch: "Physics 22-23",
      hospital: "Unknown",
      referrer: "Tanjim Uddin",
      hallName: "AE hall",
    } as ParsedDonorData,
  },
  {
    rawText: "Md.\nAshiq\nMathematics\n6th times\nA(+)\n01576452364\n10-12-25",
    expectedOutput: {
      name: "Ashiq",
      bloodGroup: "A+",
      phone: "01576452364",
      date: "10-12-2025",
      batch: "Mathematics",
      hospital: "Unknown",
      referrer: "Md.",
      hallName: "",
    } as ParsedDonorData,
  },
  {
    rawText: "Md Rowshon\n+8801533847779\nO+\nSadat Vai\nBUET.\n04-12-2025.",
    expectedOutput: {
      name: "Sadat Vai",
      bloodGroup: "O+",
      phone: "01533847779",
      date: "04-12-2025",
      batch: "Unknown",
      hospital: "BUET",
      referrer: "Md Rowshon",
      hallName: "",
    } as ParsedDonorData,
  },
  {
    rawText: "Md Rowshon\n+880 1733-119946\nTanvir Hayder vai\nAB+\nPharmacy\nPG.\n24-11-2025,",
    expectedOutput: {
      name: "Tanvir Hayder vai",
      bloodGroup: "AB+",
      phone: "01733119946",
      date: "24-11-2025",
      batch: "Pharmacy",
      hospital: "PG",
      referrer: "Md Rowshon",
      hallName: "",
    } as ParsedDonorData,
  },
  {
    rawText: "Md Rowshon\nTarek Vai\nAb+\nKomlapur\n+8801954644458\n02-12-2025.",
    expectedOutput: {
      name: "Tarek Vai",
      bloodGroup: "AB+",
      phone: "01954644458",
      date: "02-12-2025",
      batch: "Unknown",
      hospital: "Komlapur",
      referrer: "Md Rowshon",
      hallName: "",
    } as ParsedDonorData,
  },
]

async function seed() {
  console.log('Starting to seed training examples...')
  
  try {
    let skipped = 0
    let seeded = 0
    
    for (const example of trainingExamples) {
      // Check if already exists
      const existing = await prisma.parsingExample.findFirst({
        where: {
          rawText: example.rawText,
        },
      })

      if (existing) {
        skipped++
        continue
      }

      // Parse the text to get actual output
      const parsedOutput = parseWithCustomModel(example.rawText)
      
      // Calculate confidence
      let matches = 0
      let totalFields = 0
      const fields: (keyof ParsedDonorData)[] = ['name', 'bloodGroup', 'phone', 'date', 'batch', 'hospital', 'referrer', 'hallName']
      
      for (const field of fields) {
        totalFields++
        const parsed = String(parsedOutput[field] || '').trim()
        const expected = String(example.expectedOutput[field] || '').trim()
        if (parsed && expected && parsed.toLowerCase() === expected.toLowerCase()) {
          matches++
        }
      }
      
      const confidence = totalFields > 0 ? matches / totalFields : 0
      const isCorrect = confidence > 0.7
      
      await prisma.parsingExample.create({
        data: {
          rawText: example.rawText,
          expectedOutput: example.expectedOutput as any,
          parsedOutput: parsedOutput as any,
          confidence,
          isCorrect,
        },
      })
      
      seeded++
      console.log(`✓ Seeded example: ${example.expectedOutput.name} (confidence: ${(confidence * 100).toFixed(0)}%)`)
    }
    
    console.log(`\n✅ Successfully seeded ${seeded} training examples!`)
    if (skipped > 0) {
      console.log(`⏭️  Skipped ${skipped} examples (already exist)`)
    }
  } catch (error) {
    console.error('Error seeding training examples:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

seed()
