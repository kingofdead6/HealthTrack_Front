import React, { useState } from 'react';

// Footer component with an interactive health trivia quiz
const Footer = () => {
  // State for quiz functionality and UI
  const [clickCount, setClickCount] = useState(0);
  const [showQuiz, setShowQuiz] = useState(false);
  const [showWin, setShowWin] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [shuffledQuestions, setShuffledQuestions] = useState([]);

  // Health trivia questions
  const questions = [
    {
      question: 'What does BMI stand for?',
      options: ['Body Mass Index', 'Basic Metabolic Intake', 'Blood Muscle Indicator', 'Bone Mineral Intensity'],
      correct: 'Body Mass Index',
    },
    {
      question: 'Which vitamin is primarily obtained from sunlight?',
      options: ['Vitamin A', 'Vitamin B12', 'Vitamin C', 'Vitamin D'],
      correct: 'Vitamin D',
    },
    {
      question: 'How many chambers does the human heart have?',
      options: ['Two', 'Three', 'Four', 'Five'],
      correct: 'Four',
    },
    {
      question: 'What is the normal resting heart rate range for adults?',
      options: ['40-60 bpm', '60-100 bpm', '100-140 bpm', '140-180 bpm'],
      correct: '60-100 bpm',
    },
    {
      question: 'Which organ is primarily responsible for detoxifying the blood?',
      options: ['Kidney', 'Liver', 'Lung', 'Pancreas'],
      correct: 'Liver',
    },
    {
      question: 'What is the main source of energy for the body?',
      options: ['Proteins', 'Carbohydrates', 'Fats', 'Vitamins'],
      correct: 'Carbohydrates',
    },
    {
      question: 'Which blood type is known as the universal donor?',
      options: ['A+', 'B-', 'AB+', 'O-'],
      correct: 'O-',
    },
    {
      question: 'What is the largest organ in the human body?',
      options: ['Liver', 'Brain', 'Skin', 'Heart'],
      correct: 'Skin',
    },
    {
      question: 'Which mineral is essential for strong bones?',
      options: ['Iron', 'Calcium', 'Potassium', 'Zinc'],
      correct: 'Calcium',
    },
    {
      question: 'What does CPR stand for?',
      options: ['Cardiac Pulse Recovery', 'Cardiopulmonary Resuscitation', 'Cerebral Pressure Relief', 'Circulatory Pump Restoration'],
      correct: 'Cardiopulmonary Resuscitation',
    },
  ];

  // Trigger quiz after clicking "All Right Reserved" 3 times
  const handleRightsClick = () => {
    setClickCount(prev => prev + 1);
    if (clickCount + 1 >= 3) {
      const shuffled = [...questions].sort(() => Math.random() - 0.5);
      setShuffledQuestions(shuffled);
      setShowQuiz(true);
      setClickCount(0);
      setCurrentQuestion(0);
      setScore(0);
      setFeedback('');
    }
  };

  // Handle quiz answer submission
  const handleAnswer = (selectedOption) => {
    const isCorrect = selectedOption === shuffledQuestions[currentQuestion].correct;
    if (isCorrect) {
      setScore(prev => prev + 1);
      setFeedback('Correct!');
    } else {
      setFeedback(`Incorrect. The correct answer is ${shuffledQuestions[currentQuestion].correct}.`);
    }

    if (isCorrect && score + 1 >= 5) {
      setTimeout(() => {
        setShowQuiz(false);
        setShowWin(true);
      }, 1000);
      return;
    }

    setTimeout(() => {
      setCurrentQuestion(prev => (prev + 1) % shuffledQuestions.length);
      setFeedback('');
    }, 1500);
  };

  // Close the quiz
  const closeQuiz = () => {
    setShowQuiz(false);
    setCurrentQuestion(0);
    setScore(0);
    setFeedback('');
    setShuffledQuestions([]);
  };

  // Handle win screen and redirect
  const handleWinClose = () => {
    setShowWin(false);
    setCurrentQuestion(0);
    setScore(0);
    setFeedback('');
    setShuffledQuestions([]);
    window.location.href = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
  };

  return (
    <div className="bg-[#0066E6] text-white px-6 sm:px-16 py-12">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-10">
        {/* Brand Section */}
        <div>
          <h1 className="text-2xl font-bold mb-4">
            <span className="text-white">Health</span><span className="text-gray-300">Track</span>
          </h1>
          <p className="text-sm text-gray-100">
            Your health, simplified. HealthTrack connects you to trusted doctors, nurses, labs, and pharmacies — all in one place. Manage appointments, access medical records, and chat securely with healthcare professionals. Your care, your way — anytime, anywhere.
          </p>
        </div>

        {/* Useful Links */}
        <div>
          <h2 className="text-lg font-semibold mb-4">Useful Links</h2>
          <ul className="space-y-2 text-sm">
            <li><a href="/privacy-policy" className="hover:underline text-white">Privacy Policy</a></li>
            <li><a href="/our-team" className="hover:underline text-white">Our Team</a></li>
            <li><a href="/user-guide" className="hover:underline text-white">User Guide</a></li>
          </ul>
        </div>

        {/* Address with Map */}
        <div>
          <h2 className="text-lg font-semibold mb-4">Address</h2>
          <iframe
            title="map"
            src='https://www.google.com/maps/embed?pb=!1m14!1m8!1m3!1d4306.76732101497!2d3.17100482374246!3d36.70536085531627!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x128e522f3f317461%3A0x215c157a5406653c!2sHigher%20National%20School%20of%20Computer%20Science!5e1!3m2!1sen!2sdz!4v1746006545081!5m2!1sen!2sdz'
            className="rounded-lg w-full h-40 border-0"
            loading="lazy"
          ></iframe>
        </div>
      </div>

      {/* Copyright with Quiz Trigger */}
      <div className="mt-12 border-t border-blue-400 pt-4 text-center text-sm text-gray-200">
        <span
          className="cursor-pointer hover:underline"
          onClick={handleRightsClick}
        >
          HealthTrack©2025 All Right Reserved
        </span>
      </div>

      {/* Quiz Modal */}
      {showQuiz && shuffledQuestions.length > 0 && (
        <div className="fixed inset-0 bg-[#00000057] backdrop-blur-lg flex items-center justify-center z-50 transition-opacity duration-300">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-8 rounded-2xl shadow-2xl max-w-lg w-full transform transition-all duration-300 scale-100">
            <h2 className="text-3xl font-extrabold mb-6 text-blue-800 tracking-tight">
              Health Trivia Challenge
            </h2>
            <div className="flex justify-between items-center mb-6">
              <p className="text-blue-700 font-medium">
                Question {currentQuestion + 1} of {shuffledQuestions.length}
              </p>
              <p className="text-blue-700 font-medium">
                Score: {score}/5
              </p>
            </div>
            <p className="text-lg font-semibold text-gray-900 mb-6 bg-white p-4 rounded-lg shadow-sm">
              {shuffledQuestions[currentQuestion].question}
            </p>
            <div className="space-y-3">
              {shuffledQuestions[currentQuestion].options.map((option, index) => (
                <button
                  key={index}
                  onClick={() => handleAnswer(option)}
                  className="cursor-pointer w-full bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 transition-colors duration-200 text-left font-medium shadow-sm"
                >
                  {option}
                </button>
              ))}
            </div>
            {feedback && (
              <p className={`mt-6 text-center text-lg font-medium ${feedback.includes('Correct') ? 'text-green-600' : 'text-red-600'} animate-pulse`}>
                {feedback}
              </p>
            )}
            <button
              onClick={closeQuiz}
              className="cursor-pointer mt-8 w-full bg-red-600 text-white px-4 py-3 rounded-lg hover:bg-red-700 transition-colors duration-200 font-medium"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Win Modal */}
      {showWin && (
        <div className="fixed inset-0 bg-[#00000057] backdrop-blur-lg flex items-center justify-center z-50 transition-opacity duration-300">
          <div className="bg-gradient-to-br from-green-50 to-green-100 p-8 rounded-2xl shadow-2xl max-w-md w-full transform transition-all duration-300 scale-100">
            <h2 className="text-4xl font-extrabold mb-6 text-green-800 tracking-tight text-center">
              🎉 You Win!
            </h2>
            <p className="text-lg text-gray-900 mb-6 text-center font-medium">
              Congratulations! You've answered 5 questions correctly. Claim your reward!
            </p>
            <button
              onClick={handleWinClose}
              className="cursor-pointer w-full bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 transition-colors duration-200 font-medium"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Footer;