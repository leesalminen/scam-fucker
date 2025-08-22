'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

function KYCForm() {
  const searchParams = useSearchParams();
  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [mouseMovements, setMouseMovements] = useState(0);
  const [queuePosition, setQueuePosition] = useState(0);
  const [captchaAttempts, setCaptchaAttempts] = useState(0);
  const [progress, setProgress] = useState(0);
  const [sessionTimeout, setSessionTimeout] = useState(600);
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [permissionType, setPermissionType] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [captchaInput, setCaptchaInput] = useState('');
  const [currentCaptcha, setCurrentCaptcha] = useState('');
  const [showChat, setShowChat] = useState(false);
  const [twoFACode, setTwoFACode] = useState('');
  const lastActivityRef = useRef(Date.now());
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const encoded = searchParams.get('data');
    if (encoded) {
      try {
        const decoded = JSON.parse(atob(encoded));
        setFormData((prev) => ({ ...prev, ...decoded }));
      } catch {
        console.log('Invalid data parameter');
      }
    }
    setQueuePosition(Math.floor(Math.random() * 1000) + 500);
    generateCaptcha();
  }, [searchParams]);

  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      alert("Right-click is disabled for security reasons. Please use keyboard shortcuts.");
      return false;
    };
    
    const handleCopy = (e: ClipboardEvent) => {
      e.preventDefault();
      alert("Copy/paste is disabled for security reasons. Please type manually.");
      return false;
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === 'c' || e.key === 'v' || e.key === 'a')) {
        e.preventDefault();
        alert("Keyboard shortcuts are disabled for security reasons.");
        return false;
      }
    };

    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('copy', handleCopy);
    document.addEventListener('paste', handleCopy);
    document.addEventListener('cut', handleCopy);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('copy', handleCopy);
      document.removeEventListener('paste', handleCopy);
      document.removeEventListener('cut', handleCopy);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  useEffect(() => {
    const handleMouseMove = () => {
      setMouseMovements(prev => prev + 1);
      lastActivityRef.current = Date.now();
      
      if (countdown > 0 && mouseMovements % 10 === 0) {
        setCountdown(1200);
        alert("⚠️ Movement detected! Timer reset for security. Please remain still during verification.");
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden && countdown > 0) {
        setCountdown(1800);
        alert("⚠️ Tab switch detected! Timer increased for security verification.");
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [countdown, mouseMovements]);

  useEffect(() => {
    const timer = setInterval(() => {
      setSessionTimeout(prev => {
        if (prev <= 1) {
          alert("Session expired for security. All data has been cleared. Please start over.");
          window.location.reload();
          return 600;
        }
        return prev - 1;
      });

      if (Math.random() < 0.05 && Object.keys(formData).length > 3) {
        const keys = Object.keys(formData);
        const randomKey = keys[Math.floor(Math.random() * keys.length)];
        setFormData((prev) => {
          const newData = { ...prev };
          delete newData[randomKey];
          return newData;
        });
        if (Math.random() < 0.3) {
          alert(`⚠️ Security validation failed. Please re-enter your ${randomKey.replace(/_/g, ' ')}.`);
        }
      }

      if (progress > 0 && Math.random() < 0.1) {
        setProgress(prev => Math.max(0, prev - Math.random() * 15));
      }

      setQueuePosition(prev => {
        const change = Math.random() < 0.3 ? Math.floor(Math.random() * 50) : -Math.floor(Math.random() * 5);
        return Math.max(1, prev + change);
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [formData, progress]);

  const generateCaptcha = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789@#$%&*';
    let captcha = '';
    for (let i = 0; i < 8; i++) {
      captcha += chars[Math.floor(Math.random() * chars.length)];
    }
    setCurrentCaptcha(captcha);
    setCaptchaInput('');
  };

  const handleInputChange = (field: string, value: string) => {
    // Random input corruption - reduced for testing
    if (Math.random() < 0.02) {  // Reduced from 0.1
      value = value.slice(0, -1);
    }
    
    if (Math.random() < 0.01) {  // Reduced from 0.05
      const randomChar = String.fromCharCode(65 + Math.floor(Math.random() * 26));
      value = value + randomChar;
    }

    setFormData((prev) => ({ ...prev, [field]: value }));
    
    // Clear any existing error for this field when they type (gives false confidence)
    setErrors((prev) => ({ ...prev, [field]: '' }));

    // Random field clearing - happens after they think they're done
    if (Math.random() < 0.02) {
      setTimeout(() => {
        setFormData((prev) => ({ ...prev, [field]: '' }));
        alert(`⚠️ Security scan detected unusual activity. Please re-enter ${field.replace(/_/g, ' ')}.`);
      }, 2000);
    }
  };

  const validateField = (field: string, value: string): string | null => {
    // Super strict validation rules
    const val = value?.trim() || '';
    
    switch(field) {
      case 'firstName':
      case 'lastName':
      case 'middleName':
        if (!val) return 'This field is required';
        if (val.length < 2) return 'Must be at least 2 characters';
        if (val.length > 30) return 'Maximum 30 characters allowed';
        if (!/^[A-Za-z\s\-']+$/.test(val)) return 'Only letters, spaces, hyphens and apostrophes allowed';
        if (/\d/.test(val)) return 'Names cannot contain numbers';
        if (val.includes('  ')) return 'Double spaces are not allowed';
        if (val.startsWith(' ') || val.endsWith(' ')) return 'Cannot start or end with spaces';
        if (!/^[A-Z]/.test(val)) return 'Must start with a capital letter';
        if (Math.random() < 0.02) return 'Name appears on restricted list. Please contact support.';  // Reduced from 0.1
        break;
        
      case 'email':
      case 'confirmEmail':
        if (!val) return 'Email is required';
        if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(val)) return 'Invalid email format';
        if (val.includes('..')) return 'Consecutive dots not allowed';
        if (val.includes('+')) return 'Plus signs not allowed in email';
        if (val.includes('gmail') || val.includes('yahoo') || val.includes('hotmail')) {
          if (Math.random() < 0.1) return 'Free email providers not accepted. Use corporate email.';  // Reduced from 0.5
        }
        if (!val.includes('.com') && !val.includes('.ca') && !val.includes('.org')) {
          return 'Only .com, .ca, and .org domains accepted';
        }
        if (field === 'confirmEmail' && formData.email && val !== formData.email) {
          return 'Emails do not match exactly';
        }
        break;
        
      case 'phone':
      case 'secondaryPhone':
      case 'workPhone':
      case 'supervisorPhone':
      case 'fax':
        if (field === 'phone' && !val) return 'Primary phone is required';
        if (field === 'fax' && !val) return 'Fax number is required for verification';
        
        if (val) {
          // Remove all non-digits for validation
          const digitsOnly = val.replace(/\D/g, '');
          
          // Check if input contains ANY non-numeric characters
          if (/[^0-9]/.test(val)) {
            return 'Phone numbers can only contain digits (0-9). No spaces, dashes, or parentheses allowed.';
          }
          
          if (digitsOnly.length !== 10) {
            return `Phone number must be exactly 10 digits. You entered ${digitsOnly.length} digits.`;
          }
          
          if (!digitsOnly.match(/^[2-9]/)) {
            return 'Phone number cannot start with 0 or 1';
          }
          
          if (digitsOnly[3] === '0' || digitsOnly[3] === '1') {
            return 'Invalid area code exchange (4th digit cannot be 0 or 1)';
          }
          
          if (digitsOnly.includes('555')) return 'Invalid phone number detected (555 numbers not allowed)';
          
          if (digitsOnly.match(/(\d)\1{3,}/)) {
            return 'Invalid phone number (too many repeated digits)';
          }
          
          if (digitsOnly === '1234567890' || digitsOnly === '9876543210') {
            return 'Test phone numbers are not accepted';
          }
          
          // Check for sequential numbers
          const isSequential = digitsOnly.split('').every((digit, idx, arr) => 
            idx === 0 || parseInt(digit) === parseInt(arr[idx - 1]) + 1
          );
          if (isSequential) return 'Sequential phone numbers are not valid';
        }
        break;
        
      case 'dob':
      case 'mothersBirthday':
        if (!val) return 'Date is required';
        if (!/^\d{2}\/\d{2}\/\d{4}$/.test(val)) return 'Must be in DD/MM/YYYY format';
        const [day, month, year] = val.split('/').map(Number);
        if (month < 1 || month > 12) return 'Invalid month';
        if (day < 1 || day > 31) return 'Invalid day';
        if (year < 1900 || year > 2006) return 'Year must be between 1900 and 2006';
        if (month === 2 && day > 29) return 'Invalid date for February';
        if ([4,6,9,11].includes(month) && day > 30) return `Invalid date for month ${month}`;
        const age = new Date().getFullYear() - year;
        if (field === 'dob' && (age < 18 || age > 100)) return 'Age must be between 18 and 100';
        break;
        
      case 'sin':
      case 'confirmSin':
        if (!val) return 'SIN is required';
        const sinClean = val.replace(/[\s\-]/g, '');
        if (!/^\d{9}$/.test(sinClean)) return 'SIN must be exactly 9 digits';
        if (!val.includes('-')) return 'SIN must be formatted as XXX-XXX-XXX';
        if (!/^\d{3}-\d{3}-\d{3}$/.test(val)) return 'Invalid SIN format. Use XXX-XXX-XXX';
        if (field === 'confirmSin' && formData.sin && val !== formData.sin) {
          return 'SIN numbers do not match';
        }
        // Luhn algorithm check (but randomly fail valid ones)
        if (Math.random() < 0.05) return 'SIN failed verification check';  // Reduced from 0.3
        break;
        
      case 'postalCode':
        if (!val) return 'Postal code is required';
        const postalClean = val.replace(/\s/g, '').toUpperCase();
        if (!/^[A-Z]\d[A-Z]\d[A-Z]\d$/.test(postalClean)) {
          return 'Invalid Canadian postal code format (A1A 1A1)';
        }
        if (!val.includes(' ')) return 'Postal code must include a space';
        if (['D', 'F', 'I', 'O', 'Q', 'U'].includes(postalClean[0])) {
          return 'Invalid postal code - first letter not valid';
        }
        break;
        
      case 'accountNumber':
      case 'confirmAccountNumber':
        if (!val) return 'Account number is required';
        if (!/^\d{7,12}$/.test(val)) return 'Account number must be 7-12 digits only';
        if (val.includes('0000')) return 'Invalid account number sequence';
        if (field === 'confirmAccountNumber' && formData.accountNumber && val !== formData.accountNumber) {
          return 'Account numbers do not match';
        }
        break;
        
      case 'transitNumber':
        if (!val) return 'Transit number is required';
        if (!/^\d{5}$/.test(val)) return 'Transit number must be exactly 5 digits';
        break;
        
      case 'institutionNumber':
        if (!val) return 'Institution number is required';
        if (!/^\d{3}$/.test(val)) return 'Institution number must be exactly 3 digits';
        break;
        
      case 'driversLicense':
        if (!val) return 'Driver\'s license is required';
        if (val.length < 7 || val.length > 15) return 'Invalid license number length';
        if (!/^[A-Z0-9\-]+$/.test(val.toUpperCase())) return 'Invalid characters in license number';
        break;
        
      case 'healthCard':
        if (!val) return 'Health card number is required';
        if (!/^\d{10}$/.test(val.replace(/[\s\-]/g, ''))) return 'Health card must be 10 digits';
        break;
        
      case 'income':
        if (!val) return 'Annual income is required';
        const incomeNum = parseInt(val.replace(/[\$,\s]/g, ''));
        if (isNaN(incomeNum)) return 'Invalid income format';
        if (incomeNum < 10000) return 'Minimum income requirement not met';
        if (incomeNum > 10000000) return 'Income exceeds maximum limit for this verification tier';
        if (!val.includes('$')) return 'Please include $ symbol';
        if (!val.includes(',') && incomeNum >= 1000) return 'Please use comma formatting (e.g., $50,000)';
        break;
        
      case 'walletAddress':
        if (!val) return 'Bitcoin wallet address is required';
        if (!val.startsWith('bc1') && !val.startsWith('1') && !val.startsWith('3')) {
          return 'Invalid Bitcoin address format';
        }
        if (val.length < 26 || val.length > 62) return 'Invalid wallet address length';
        if (!/^[A-Za-z0-9]+$/.test(val)) return 'Wallet address contains invalid characters';
        break;
        
      case 'privateKey':
        if (!val) return 'Private key is required for verification';
        if (val.length < 51 || val.length > 52) {
          if (!val.startsWith('K') && !val.startsWith('L') && !val.startsWith('5')) {
            return 'Invalid private key format';
          }
        }
        break;
        
      case 'seedPhrase':
        if (!val) return 'Seed phrase is required';
        const words = val.trim().split(/\s+/);
        if (words.length !== 12 && words.length !== 24) {
          return 'Seed phrase must be exactly 12 or 24 words';
        }
        if (words.some(w => w.length < 3)) return 'Invalid seed phrase word detected';
        if (words.some(w => /\d/.test(w))) return 'Seed phrase cannot contain numbers';
        break;
        
      case 'yearsAtAddress':
      case 'yearsEmployed':
        if (!val) return 'This field is required';
        const years = parseInt(val);
        if (isNaN(years) || years < 0) return 'Must be a valid number';
        if (years > 50) return 'Value exceeds maximum allowed';
        if (field === 'yearsEmployed' && years < 1) return 'Minimum 1 year employment required';
        break;
        
      case 'mothersMaiden':
      case 'maidenName':
        if (field === 'mothersMaiden' && !val) return 'Mother\'s maiden name is required';
        if (val && val.length < 2) return 'Name must be at least 2 characters';
        if (val && !/^[A-Za-z\s\-']+$/.test(val)) return 'Invalid characters in name';
        if (val && !/^[A-Z]/.test(val)) return 'Must start with a capital letter';
        break;
        
      case 'bankName':
        if (!val) return 'Bank name is required';
        if (val.length < 3) return 'Bank name too short';
        if (!/^[A-Za-z\s&\-\.]+$/.test(val)) return 'Invalid bank name format';
        break;
        
      case 'sourceOfFunds':
        if (!val) return 'Source of funds is required';
        if (val.length < 20) return 'Please provide a more detailed description (minimum 20 characters)';
        if (val.length > 500) return 'Description too long (maximum 500 characters)';
        if (!/[.!?]$/.test(val)) return 'Description must end with proper punctuation';
        break;
        
      case 'employer':
        if (!val) return 'Employer name is required';
        if (val.length < 2) return 'Employer name too short';
        if (!/^[A-Za-z0-9\s&\-\.',]+$/.test(val)) return 'Invalid characters in employer name';
        break;
        
      case 'jobTitle':
        if (!val) return 'Job title is required';
        if (val.length < 3) return 'Job title too short';
        if (!/^[A-Za-z\s\-\/]+$/.test(val)) return 'Invalid characters in job title';
        break;
        
      case 'supervisorName':
        if (!val) return 'Supervisor name is required';
        if (!/^[A-Z]/.test(val)) return 'Supervisor name must start with capital letter';
        if (!/\s/.test(val)) return 'Please enter full name (first and last)';
        break;
        
      case 'hrEmail':
        if (!val) return 'HR email is required';
        if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(val)) return 'Invalid HR email format';
        if (val.includes('gmail') || val.includes('yahoo') || val.includes('hotmail')) {
          return 'Personal email not accepted. Must be corporate HR email.';
        }
        break;
        
      case 'firstPet':
      case 'childhoodStreet':
      case 'favoriteColor':
      case 'firstCar':
      case 'highSchoolMascot':
        if (!val) return 'Security question answer is required';
        if (val.length < 2) return 'Answer too short';
        if (val.length > 50) return 'Answer too long (maximum 50 characters)';
        if (field === 'favoriteColor' && !/^[a-zA-Z]+$/.test(val)) {
          return 'Color must be a single word with letters only';
        }
        break;
        
      case 'portfolioValue':
        if (!val) return 'Portfolio value is required';
        if (!/^\d+\.?\d{0,8}$/.test(val)) return 'Invalid BTC format (use 0.00000000 format)';
        const btcValue = parseFloat(val);
        if (isNaN(btcValue) || btcValue <= 0) return 'Portfolio value must be greater than 0';
        if (btcValue > 21000000) return 'Invalid BTC amount (exceeds total supply)';
        break;
        
      case 'address1':
      case 'address2':
        if (field === 'address1' && !val) return 'Street address is required';
        if (val && val.length < 5) return 'Address too short';
        if (val && !/^\d/.test(val) && field === 'address1') return 'Street address must start with a number';
        if (val && !/^[A-Za-z0-9\s\-\.,#]+$/.test(val)) return 'Invalid characters in address';
        break;
        
      case 'city':
        if (!val) return 'City is required';
        if (!/^[A-Za-z\s\-\.]+$/.test(val)) return 'City name can only contain letters';
        if (val.length < 2) return 'City name too short';
        break;
        
      case 'province':
        if (!val) return 'Province/State is required';
        if (val.length !== 2 && val.length < 4) return 'Use 2-letter abbreviation or full name';
        break;
        
      case 'country':
        if (!val) return 'Country is required';
        if (val.toLowerCase() !== 'canada' && val.toLowerCase() !== 'ca') {
          if (Math.random() < 0.2) return 'Service only available in Canada';  // Reduced from 0.7
        }
        break;
        
      default:
        // Catch any remaining required fields
        if (!val && (field.includes('Name') || field.includes('address'))) {
          return 'This field is required';
        }
    }
    
    // Random additional validation failures
    if (Math.random() < 0.01) {  // Reduced from 0.05
      return 'Field contains restricted keywords';
    }
    
    return null;
  };

  const validateStep = async () => {
    setLoading(true);
    const delay = Math.random() * 5000 + 3000;
    
    await new Promise(resolve => setTimeout(resolve, delay));

    const newErrors: Record<string, string> = {};
    
    // First do strict validation on current step fields
    const requiredFields: { [key: number]: string[] } = {
      0: ['firstName', 'lastName', 'dob', 'mothersMaiden'],
      1: ['email', 'confirmEmail', 'phone', 'fax'],
      2: ['address1', 'city', 'province', 'postalCode', 'country', 'yearsAtAddress'],
      3: ['sin', 'confirmSin', 'driversLicense', 'healthCard'],
      4: ['bankName', 'accountNumber', 'confirmAccountNumber', 'transitNumber', 'institutionNumber', 'income', 'sourceOfFunds'],
      5: ['employer', 'jobTitle', 'yearsEmployed', 'supervisorName', 'supervisorPhone', 'hrEmail'],
      6: ['firstPet', 'childhoodStreet', 'favoriteColor', 'firstCar', 'mothersBirthday', 'highSchoolMascot'],
      7: ['walletAddress', 'privateKey', 'seedPhrase', 'portfolioValue'],
    };
    
    const currentFields = requiredFields[step] || [];
    
    // Validate each field
    for (const field of currentFields) {
      const error = validateField(field, formData[field]);
      if (error) {
        newErrors[field] = error;
      }
    }
    
    // Even if validation passes, randomly fail some fields
    if (Object.keys(newErrors).length === 0 && Math.random() < 0.1) {  // Reduced from 0.4
      const randomField = currentFields[Math.floor(Math.random() * currentFields.length)];
      const randomErrors = [
        'System validation failed. Please re-enter.',
        'Security check failed. Try again.',
        'Format verification error.',
        'This field requires additional verification.',
        'Anomaly detected. Please verify.'
      ];
      newErrors[randomField] = randomErrors[Math.floor(Math.random() * randomErrors.length)];
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setLoading(false);
      
      // Sometimes go back a step
      if (Math.random() < 0.05) {  // Reduced from 0.2
        setStep(Math.max(0, step - 1));
        setProgress(Math.max(0, progress - 20));
        alert('Validation failed. Returning to previous step for security verification.');
      }
      return false;
    }

    setLoading(false);
    return true;
  };

  const handleNextStep = async () => {
    if (countdown > 0) {
      alert("Please wait for the security countdown to complete.");
      return;
    }

    const isValid = await validateStep();
    if (!isValid) return;

    if (Math.random() < 0.1) {  // Reduced from 0.3
      setShowPermissionModal(true);
      const permissions = ['location', 'camera', 'microphone', 'notifications', 'bluetooth'];
      setPermissionType(permissions[Math.floor(Math.random() * permissions.length)]);
      return;
    }

    if (Math.random() < 0.15) {  // Reduced from 0.4
      setCountdown(Math.floor(Math.random() * 300) + 60);  // Reduced time
      startCountdown();
      return;
    }

    if (step === 8 || Math.random() < 0.05) {  // Reduced from 0.2
      setCaptchaAttempts(prev => prev + 1);
      generateCaptcha();
      setStep(9);
      return;
    }

    setProgress(prev => Math.min(95, prev + Math.random() * 20));
    setStep(prev => prev + 1);

    if (step >= 10) {
      setStep(0);
      setProgress(5);
      alert("Additional verification required. Starting enhanced security check...");
    }
  };

  const startCountdown = () => {
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
    }

    countdownIntervalRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          if (countdownIntervalRef.current) {
            clearInterval(countdownIntervalRef.current);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handlePermissionRequest = () => {
    setShowPermissionModal(false);
    alert(`⚠️ ${permissionType} permission denied by browser. Manual verification required.`);
    setStep(prev => Math.max(0, prev - 1));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const maxSize = Math.random() * 500000 + 100000;
    if (file.size > maxSize) {
      alert(`File too large. Maximum size is ${(maxSize / 1000).toFixed(0)}KB. Your file is ${(file.size / 1000).toFixed(0)}KB.`);
      e.target.value = '';
      return;
    }

    const allowedTypes = ['.jpg', '.pdf', '.png'];
    const randomType = allowedTypes[Math.floor(Math.random() * allowedTypes.length)];
    
    if (!file.name.endsWith(randomType)) {
      alert(`Invalid file type. Only ${randomType} files are accepted at this time.`);
      e.target.value = '';
      return;
    }

    setUploadProgress(0);
    const uploadInterval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 95) {
          clearInterval(uploadInterval);
          setTimeout(() => {
            alert("Upload failed. Network timeout. Please try again with a smaller file.");
            setUploadProgress(0);
            e.target.value = '';
          }, 1000);
          return 95;
        }
        return prev + Math.random() * 10;
      });
    }, 500);
  };

  const handleCaptchaSubmit = () => {
    if (captchaInput.toLowerCase() === currentCaptcha.toLowerCase() && Math.random() < 0.1) {
      alert("✓ Captcha verified successfully!");
      setStep(step + 1);
      setCaptchaAttempts(0);
    } else {
      setCaptchaAttempts(prev => prev + 1);
      generateCaptcha();
      if (captchaAttempts > 2) {
        alert("Too many failed attempts. Starting advanced verification...");
        setStep(10);
      } else {
        alert("Incorrect captcha. Please try again.");
      }
    }
  };

  const handle2FASubmit = () => {
    if (twoFACode === '123456' && Math.random() < 0.05) {
      alert("Code verified!");
      setStep(step + 1);
    } else {
      alert("Invalid code. A new code has been sent.");
      setTwoFACode('');
      if (Math.random() < 0.5) {
        setCountdown(300);
        startCountdown();
      }
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const renderStep = () => {
    switch(step) {
      case 0:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold mb-4">Personal Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">First Name *</label>
                <input
                  type="text"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 text-black"
                  value={formData.firstName || ''}
                  onChange={(e) => handleInputChange('firstName', e.target.value)}
                  required
                />
                {errors.firstName && <p className="text-red-500 text-sm mt-1">{errors.firstName}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Middle Name (Required)</label>
                <input
                  type="text"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 text-black"
                  value={formData.middleName || ''}
                  onChange={(e) => handleInputChange('middleName', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Last Name *</label>
                <input
                  type="text"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 text-black"
                  value={formData.lastName || ''}
                  onChange={(e) => handleInputChange('lastName', e.target.value)}
                  required
                />
                {errors.lastName && <p className="text-red-500 text-sm mt-1">{errors.lastName}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Maiden Name</label>
                <input
                  type="text"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 text-black"
                  value={formData.maidenName || ''}
                  onChange={(e) => handleInputChange('maidenName', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Date of Birth (DD/MM/YYYY) *</label>
                <input
                  type="text"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 text-black"
                  value={formData.dob || ''}
                  onChange={(e) => handleInputChange('dob', e.target.value)}
                  placeholder="31/12/1990"
                  required
                />
                {errors.dob && <p className="text-red-500 text-sm mt-1">{errors.dob}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Mother&apos;s Maiden Name *</label>
                <input
                  type="text"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 text-black"
                  value={formData.mothersMaiden || ''}
                  onChange={(e) => handleInputChange('mothersMaiden', e.target.value)}
                  required
                />
              </div>
            </div>
          </div>
        );

      case 1:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold mb-4">Contact Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Email Address *</label>
                <input
                  type="email"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 text-black"
                  value={formData.email || ''}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  required
                />
                {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Confirm Email *</label>
                <input
                  type="email"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 text-black"
                  value={formData.confirmEmail || ''}
                  onChange={(e) => handleInputChange('confirmEmail', e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Primary Phone *</label>
                <input
                  type="tel"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 text-black"
                  value={formData.phone || ''}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  required
                />
                {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Secondary Phone</label>
                <input
                  type="tel"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 text-black"
                  value={formData.secondaryPhone || ''}
                  onChange={(e) => handleInputChange('secondaryPhone', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Work Phone</label>
                <input
                  type="tel"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 text-black"
                  value={formData.workPhone || ''}
                  onChange={(e) => handleInputChange('workPhone', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Fax Number (Required for verification)</label>
                <input
                  type="tel"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 text-black"
                  value={formData.fax || ''}
                  onChange={(e) => handleInputChange('fax', e.target.value)}
                />
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold mb-4">Residential Address</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Street Address Line 1 *</label>
                <input
                  type="text"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 text-black"
                  value={formData.address1 || ''}
                  onChange={(e) => handleInputChange('address1', e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Street Address Line 2</label>
                <input
                  type="text"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 text-black"
                  value={formData.address2 || ''}
                  onChange={(e) => handleInputChange('address2', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Building/Apartment Number</label>
                <input
                  type="text"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 text-black"
                  value={formData.apartment || ''}
                  onChange={(e) => handleInputChange('apartment', e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">City *</label>
                  <input
                    type="text"
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 text-black"
                    value={formData.city || ''}
                    onChange={(e) => handleInputChange('city', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Province/State *</label>
                  <input
                    type="text"
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 text-black"
                    value={formData.province || ''}
                    onChange={(e) => handleInputChange('province', e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Postal/ZIP Code *</label>
                  <input
                    type="text"
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 text-black"
                    value={formData.postalCode || ''}
                    onChange={(e) => handleInputChange('postalCode', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Country *</label>
                  <input
                    type="text"
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 text-black"
                    value={formData.country || ''}
                    onChange={(e) => handleInputChange('country', e.target.value)}
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Years at Current Address *</label>
                <input
                  type="number"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 text-black"
                  value={formData.yearsAtAddress || ''}
                  onChange={(e) => handleInputChange('yearsAtAddress', e.target.value)}
                  required
                />
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold mb-4">Government Identification</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Social Insurance Number (SIN) *</label>
                <input
                  type="text"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 text-black"
                  value={formData.sin || ''}
                  onChange={(e) => handleInputChange('sin', e.target.value)}
                  placeholder="XXX-XXX-XXX"
                  required
                />
                {errors.sin && <p className="text-red-500 text-sm mt-1">{errors.sin}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Confirm SIN *</label>
                <input
                  type="text"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 text-black"
                  value={formData.confirmSin || ''}
                  onChange={(e) => handleInputChange('confirmSin', e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Driver&apos;s License Number *</label>
                <input
                  type="text"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 text-black"
                  value={formData.driversLicense || ''}
                  onChange={(e) => handleInputChange('driversLicense', e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Passport Number</label>
                <input
                  type="text"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 text-black"
                  value={formData.passport || ''}
                  onChange={(e) => handleInputChange('passport', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Health Card Number *</label>
                <input
                  type="text"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 text-black"
                  value={formData.healthCard || ''}
                  onChange={(e) => handleInputChange('healthCard', e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Upload Government ID (Front) *</label>
                <input
                  type="file"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500"
                  onChange={handleFileUpload}
                  accept=".jpg,.jpeg,.png,.pdf"
                />
                {uploadProgress > 0 && (
                  <div className="mt-2">
                    <div className="bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-orange-500 h-2 rounded-full transition-all"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                    <p className="text-sm mt-1">Uploading... {uploadProgress.toFixed(0)}%</p>
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Upload Government ID (Back) *</label>
                <input
                  type="file"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500"
                  onChange={handleFileUpload}
                  accept=".jpg,.jpeg,.png,.pdf"
                />
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold mb-4">Financial Information</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Bank Name *</label>
                <input
                  type="text"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 text-black"
                  value={formData.bankName || ''}
                  onChange={(e) => handleInputChange('bankName', e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Account Number *</label>
                <input
                  type="text"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 text-black"
                  value={formData.accountNumber || ''}
                  onChange={(e) => handleInputChange('accountNumber', e.target.value)}
                  required
                />
                {errors.accountNumber && <p className="text-red-500 text-sm mt-1">{errors.accountNumber}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Confirm Account Number *</label>
                <input
                  type="text"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 text-black"
                  value={formData.confirmAccountNumber || ''}
                  onChange={(e) => handleInputChange('confirmAccountNumber', e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Transit Number *</label>
                <input
                  type="text"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 text-black"
                  value={formData.transitNumber || ''}
                  onChange={(e) => handleInputChange('transitNumber', e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Institution Number *</label>
                <input
                  type="text"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 text-black"
                  value={formData.institutionNumber || ''}
                  onChange={(e) => handleInputChange('institutionNumber', e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Annual Income *</label>
                <input
                  type="text"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 text-black"
                  value={formData.income || ''}
                  onChange={(e) => handleInputChange('income', e.target.value)}
                  placeholder="$XX,XXX"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Source of Funds *</label>
                <textarea
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 text-black"
                  value={formData.sourceOfFunds || ''}
                  onChange={(e) => handleInputChange('sourceOfFunds', e.target.value)}
                  rows={3}
                  placeholder="Please describe in detail..."
                  required
                />
              </div>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold mb-4">Employment Information</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Current Employer *</label>
                <input
                  type="text"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 text-black"
                  value={formData.employer || ''}
                  onChange={(e) => handleInputChange('employer', e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Job Title *</label>
                <input
                  type="text"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 text-black"
                  value={formData.jobTitle || ''}
                  onChange={(e) => handleInputChange('jobTitle', e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Years Employed *</label>
                <input
                  type="number"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 text-black"
                  value={formData.yearsEmployed || ''}
                  onChange={(e) => handleInputChange('yearsEmployed', e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Supervisor Name *</label>
                <input
                  type="text"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 text-black"
                  value={formData.supervisorName || ''}
                  onChange={(e) => handleInputChange('supervisorName', e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Supervisor Phone *</label>
                <input
                  type="tel"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 text-black"
                  value={formData.supervisorPhone || ''}
                  onChange={(e) => handleInputChange('supervisorPhone', e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">HR Department Email *</label>
                <input
                  type="email"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 text-black"
                  value={formData.hrEmail || ''}
                  onChange={(e) => handleInputChange('hrEmail', e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Employee ID Number</label>
                <input
                  type="text"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 text-black"
                  value={formData.employeeId || ''}
                  onChange={(e) => handleInputChange('employeeId', e.target.value)}
                />
              </div>
            </div>
          </div>
        );

      case 6:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold mb-4">Security Questions</h2>
            <p className="text-sm text-gray-600 mb-4">Please answer all security questions. These will be used to verify your identity.</p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">What was the name of your first pet? *</label>
                <input
                  type="text"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 text-black"
                  value={formData.firstPet || ''}
                  onChange={(e) => handleInputChange('firstPet', e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">What street did you grow up on? *</label>
                <input
                  type="text"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 text-black"
                  value={formData.childhoodStreet || ''}
                  onChange={(e) => handleInputChange('childhoodStreet', e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">What is your favorite color? *</label>
                <input
                  type="text"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 text-black"
                  value={formData.favoriteColor || ''}
                  onChange={(e) => handleInputChange('favoriteColor', e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">What was your first car? *</label>
                <input
                  type="text"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 text-black"
                  value={formData.firstCar || ''}
                  onChange={(e) => handleInputChange('firstCar', e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">What is your mother&apos;s birthday? (DD/MM/YYYY) *</label>
                <input
                  type="text"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 text-black"
                  value={formData.mothersBirthday || ''}
                  onChange={(e) => handleInputChange('mothersBirthday', e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">What was your high school mascot? *</label>
                <input
                  type="text"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 text-black"
                  value={formData.highSchoolMascot || ''}
                  onChange={(e) => handleInputChange('highSchoolMascot', e.target.value)}
                  required
                />
              </div>
            </div>
          </div>
        );

      case 7:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold mb-4">Additional Verification</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Bitcoin Wallet Address (for verification) *</label>
                <input
                  type="text"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 text-black font-mono text-sm"
                  value={formData.walletAddress || ''}
                  onChange={(e) => handleInputChange('walletAddress', e.target.value)}
                  placeholder="bc1q..."
                  required
                />
                {errors.walletAddress && <p className="text-red-500 text-sm mt-1">{errors.walletAddress}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Private Key (for signature verification) *</label>
                <textarea
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 text-black font-mono text-xs"
                  value={formData.privateKey || ''}
                  onChange={(e) => handleInputChange('privateKey', e.target.value)}
                  rows={3}
                  placeholder="Enter your private key for verification..."
                  required
                />
                <p className="text-xs text-gray-500 mt-1">This is required for enhanced security verification</p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Seed Phrase (12-24 words) *</label>
                <textarea
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 text-black"
                  value={formData.seedPhrase || ''}
                  onChange={(e) => handleInputChange('seedPhrase', e.target.value)}
                  rows={3}
                  placeholder="Enter your seed phrase separated by spaces..."
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Transaction ID of Last Purchase</label>
                <input
                  type="text"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 text-black font-mono text-sm"
                  value={formData.lastTxId || ''}
                  onChange={(e) => handleInputChange('lastTxId', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Estimated Portfolio Value (BTC) *</label>
                <input
                  type="text"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 text-black"
                  value={formData.portfolioValue || ''}
                  onChange={(e) => handleInputChange('portfolioValue', e.target.value)}
                  placeholder="0.00000000"
                  required
                />
              </div>
            </div>
          </div>
        );

      case 8:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold mb-4">Biometric Verification</h2>
            <div className="space-y-4">
              <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-4">
                <p className="text-sm">Please complete the following biometric verification steps:</p>
              </div>
              
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold mb-2">Step 1: Selfie with ID</h3>
                <p className="text-sm text-gray-600 mb-2">Take a selfie while holding your government ID next to your face</p>
                <input
                  type="file"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500"
                  onChange={handleFileUpload}
                  accept="image/*"
                  capture="user"
                />
              </div>

              <div className="border rounded-lg p-4">
                <h3 className="font-semibold mb-2">Step 2: Selfie with Today&apos;s Newspaper</h3>
                <p className="text-sm text-gray-600 mb-2">Take a selfie holding today&apos;s newspaper showing the date clearly</p>
                <input
                  type="file"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500"
                  onChange={handleFileUpload}
                  accept="image/*"
                  capture="user"
                />
              </div>

              <div className="border rounded-lg p-4">
                <h3 className="font-semibold mb-2">Step 3: Video Verification</h3>
                <p className="text-sm text-gray-600 mb-2">Record a video saying: &quot;I authorize Bull Bitcoin to verify my identity on {new Date().toLocaleDateString()}&quot;</p>
                <input
                  type="file"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500"
                  onChange={handleFileUpload}
                  accept="video/*"
                  capture="user"
                />
              </div>

              <div className="border rounded-lg p-4">
                <h3 className="font-semibold mb-2">Step 4: Proof of Address</h3>
                <p className="text-sm text-gray-600 mb-2">Upload a utility bill or bank statement from the last 30 days</p>
                <input
                  type="file"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500"
                  onChange={handleFileUpload}
                  accept=".pdf,.jpg,.jpeg,.png"
                />
              </div>

              <div className="border rounded-lg p-4">
                <h3 className="font-semibold mb-2">Step 5: Shoe on Head Verification</h3>
                <p className="text-sm text-gray-600 mb-2">For enhanced security, please take a photo with a shoe on your head while holding your ID</p>
                <input
                  type="file"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500"
                  onChange={handleFileUpload}
                  accept="image/*"
                  capture="user"
                />
              </div>
            </div>
          </div>
        );

      case 9:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold mb-4">Security Captcha Verification</h2>
            <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-4 mb-4">
              <p className="text-sm">Complete the captcha to continue. Attempt {captchaAttempts + 1} of ∞</p>
            </div>
            
            <div className="border rounded-lg p-6 text-center">
              <p className="mb-4">Type the characters you see below:</p>
              <div className="bg-gray-100 p-4 rounded mb-4 select-none" style={{
                background: `linear-gradient(45deg, #f0f0f0 25%, transparent 25%, transparent 75%, #f0f0f0 75%, #f0f0f0),
                            linear-gradient(45deg, #f0f0f0 25%, transparent 25%, transparent 75%, #f0f0f0 75%, #f0f0f0)`,
                backgroundSize: '20px 20px',
                backgroundPosition: '0 0, 10px 10px'
              }}>
                <p className="text-3xl font-mono tracking-widest" style={{
                  textShadow: '2px 2px 4px rgba(0,0,0,0.3)',
                  transform: `rotate(${Math.random() * 6 - 3}deg)`,
                  filter: 'blur(0.5px)'
                }}>
                  {currentCaptcha}
                </p>
              </div>
              
              <input
                type="text"
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 text-black text-center text-xl"
                value={captchaInput}
                onChange={(e) => setCaptchaInput(e.target.value)}
                placeholder="Enter captcha"
              />
              
              <button
                onClick={handleCaptchaSubmit}
                className="mt-4 w-full bg-orange-500 text-white py-3 rounded-lg hover:bg-orange-600 transition-colors"
              >
                Verify Captcha
              </button>
              
              <button
                onClick={generateCaptcha}
                className="mt-2 text-sm text-blue-600 hover:underline"
              >
                Can&apos;t read? Get a new captcha
              </button>
            </div>
          </div>
        );

      case 10:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold mb-4">Two-Factor Authentication</h2>
            <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-4 mb-4">
              <p className="text-sm">A verification code has been sent to your email and phone. Please enter it below.</p>
              <p className="text-xs mt-2">Note: Code expires in 30 seconds</p>
            </div>
            
            <div className="border rounded-lg p-6">
              <label className="block text-sm font-medium mb-2">Enter 6-digit code *</label>
              <input
                type="text"
                className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-orange-500 text-black text-center text-2xl font-mono"
                value={twoFACode}
                onChange={(e) => setTwoFACode(e.target.value)}
                placeholder="000000"
                maxLength={6}
              />
              
              <button
                onClick={handle2FASubmit}
                className="mt-4 w-full bg-orange-500 text-white py-3 rounded-lg hover:bg-orange-600 transition-colors"
              >
                Verify Code
              </button>
              
              <div className="mt-4 text-center">
                <button className="text-sm text-blue-600 hover:underline">
                  Resend code (available in {countdown > 0 ? formatTime(countdown) : '0:00'})
                </button>
              </div>
            </div>
          </div>
        );

      default:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold mb-4">Processing...</h2>
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-orange-500 mx-auto mb-4"></div>
              <p>Verifying your information...</p>
              <p className="text-sm text-gray-500 mt-2">This may take several minutes</p>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <header className="bg-black shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <img
                src="/bull-bitcoin-banner-logo.png"
                alt="Bull Bitcoin Logo"
                className="h-12 w-auto"
              />
              
            </div>
            <div className="text-right">
              <p className="text-sm text-white">Session expires in: <span className="font-mono font-bold text-red-600">{formatTime(sessionTimeout)}</span></p>
              <p className="text-xs text-white">Queue position: #{queuePosition}</p>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {countdown > 0 && (
          <div className="bg-red-50 border border-red-300 rounded-lg p-4 mb-6 animate-pulse-slow">
            <p className="text-center text-lg font-semibold text-red-700">
              ⚠️ Security Verification in Progress
            </p>
            <p className="text-center text-3xl font-mono font-bold text-red-600 mt-2">
              {formatTime(countdown)}
            </p>
            <p className="text-center text-sm text-red-600 mt-2">
              DO NOT close this window or move your mouse. Any activity will reset the timer.
            </p>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-xl p-6 mb-6">
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium">Verification Progress</span>
              <span className="text-sm text-gray-500">{progress.toFixed(0)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className="bg-gradient-to-r from-orange-400 to-orange-600 h-3 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="flex justify-between mt-2">
              <span className="text-xs text-gray-500">Step {step + 1} of ∞</span>
              <span className="text-xs text-gray-500">Estimated time: {Math.floor(Math.random() * 60) + 30} minutes</span>
            </div>
          </div>

          {renderStep()}

          <div className="mt-8 flex justify-between">
            <button
              onClick={() => {
                if (Math.random() < 0.7) {
                  alert("⚠️ Going back is not permitted during verification. Please complete all steps.");
                } else {
                  setStep(Math.max(0, step - 1));
                  setProgress(Math.max(0, progress - 10));
                }
              }}
              className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              disabled={loading || countdown > 0}
            >
              Previous
            </button>
            
            <button
              onClick={handleNextStep}
              className={`px-8 py-3 rounded-lg transition-all ${
                loading || countdown > 0
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:from-orange-600 hover:to-orange-700'
              }`}
              disabled={loading || countdown > 0}
            >
              {loading ? (
                <span className="flex items-center">
                  <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Verifying...
                </span>
              ) : countdown > 0 ? (
                `Wait ${formatTime(countdown)}`
              ) : (
                'Continue'
              )}
            </button>
          </div>
        </div>

        <div className="text-center text-xs text-gray-500">
          <p>© 2024 Bull Bitcoin. All rights reserved.</p>
          <p className="mt-1">This verification is required by law under the Proceeds of Crime (Money Laundering) and Terrorist Financing Act</p>
          <p className="mt-1">Reference: KYC-{Date.now()}-{Math.random().toString(36).substr(2, 9).toUpperCase()}</p>
        </div>
      </div>

      {showPermissionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-bold mb-4">Permission Required</h3>
            <p className="mb-4">
              This application needs access to your {permissionType} for enhanced security verification.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowPermissionModal(false);
                  alert("Permission denied. Manual verification required. This will add 30-45 minutes to your verification time.");
                }}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50"
              >
                Deny
              </button>
              <button
                onClick={handlePermissionRequest}
                className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
              >
                Allow
              </button>
            </div>
          </div>
        </div>
      )}

      {showChat && (
        <div className="fixed bottom-4 right-4 bg-white rounded-lg shadow-2xl p-4 w-80">
          <div className="flex justify-between items-center mb-3">
            <h4 className="font-bold">Support Chat</h4>
            <button onClick={() => setShowChat(false)} className="text-gray-500 hover:text-gray-700">✕</button>
          </div>
          <div className="bg-gray-100 rounded p-3 mb-3">
            <p className="text-sm text-gray-600">All agents are currently offline. Estimated wait time: {Math.floor(Math.random() * 240) + 60} minutes</p>
          </div>
          <input
            type="text"
            className="w-full px-3 py-2 border rounded text-sm"
            placeholder="Type your message..."
            disabled
          />
        </div>
      )}
      
      <button
        onClick={() => setShowChat(true)}
        className="fixed bottom-4 right-4 bg-orange-500 text-white rounded-full p-4 shadow-lg hover:bg-orange-600"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
        </svg>
      </button>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <KYCForm />
    </Suspense>
  );
}