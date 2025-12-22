import React from 'react';
import Link from 'next/link';
import { css } from '@/styled-system/css';
import { flex, grid } from '@/styled-system/patterns';

export default function DemoPage() {
  return (
    <div className={css({ minH: 'screen', bg: 'gray.50', py: 12 })}>
      <div className={css({ 
        maxW: '7xl',
        mx: 'auto',
        px: { base: 4, lg: 6 }
      })}>
        {/* Header */}
        <div className={css({ textAlign: 'center', mb: 12 })}>
          <h1 className={css({ 
            fontSize: { base: '5xl', lg: '6xl' },
            fontWeight: 'extrabold',
            color: 'gray.900',
            mb: 4
          })}>
            🎤 AI Voice Demos
          </h1>
          <p className={css({ 
            fontSize: { base: 'lg', lg: 'xl' },
            color: 'gray.600',
            maxW: '3xl',
            mx: 'auto',
            mb: 8
          })}>
            Experience the power of AI voice cloning and generation
          </p>
          <div className={flex({ gap: 4, justifyContent: 'center', flexWrap: 'wrap' })}>
            <Link
              href="/voices/new"
              className={css({ 
                px: 6,
                py: 3,
                bg: 'cayenne',
                color: 'white',
                fontWeight: 'bold',
                rounded: 'lg',
                fontSize: 'base',
                _hover: { opacity: 0.9 },
                transition: 'all',
                shadow: 'lg'
              })}
            >
              Create Your Voice →
            </Link>
            <Link
              href="/"
              className={css({ 
                px: 6,
                py: 3,
                border: '2px solid',
                borderColor: 'cayenne',
                color: 'cayenne',
                fontWeight: 'bold',
                rounded: 'lg',
                fontSize: 'base',
                _hover: { bg: 'red.50' },
                transition: 'all'
              })}
            >
              Back to Home
            </Link>
          </div>
        </div>

        {/* Text-to-Speech Section */}
        <div className={css({ mb: 16 })}>
          <div className={css({ 
            textAlign: 'center',
            mb: 8
          })}>
            <h2 className={css({ 
              fontSize: { base: '3xl', lg: '4xl' },
              fontWeight: 'extrabold',
              color: 'gray.900',
              mb: 3
            })}>
              🎙️ Text-to-Speech
            </h2>
            <p className={css({ 
              fontSize: 'lg',
              color: 'gray.600'
            })}>
              Convert any text to natural-sounding speech
            </p>
          </div>

          <div className={grid({ columns: { base: 1, lg: 2 }, gap: 6 })}>
            {/* Sample 1 */}
            <div className={css({ 
              bg: 'white',
              rounded: '2xl',
              p: 8,
              shadow: 'lg',
              border: '2px solid',
              borderColor: 'gray.100'
            })}>
              <h3 className={css({ 
                fontSize: 'xl',
                fontWeight: 'bold',
                color: 'gray.900',
                mb: 2
              })}>
                Expressive Speech
              </h3>
              <p className={css({ 
                fontSize: 'sm',
                color: 'gray.600',
                mb: 6,
                lineHeight: '1.6'
              })}>
                "The future of voice technology is here, and it's incredibly natural and expressive."
              </p>
              <audio 
                controls 
                className={css({ 
                  w: 'full',
                  h: 12,
                  rounded: 'lg'
                })}
              >
                <source src="/demo/tts-sample-1.mp3" type="audio/mpeg" />
                Your browser does not support the audio element.
              </audio>
              <div className={flex({ 
                mt: 4,
                gap: 2,
                flexWrap: 'wrap'
              })}>
                <span className={css({ 
                  px: 2,
                  py: 1,
                  bg: 'blue.100',
                  color: 'blue.800',
                  fontSize: 'xs',
                  fontWeight: 'semibold',
                  rounded: 'md'
                })}>
                  Professional
                </span>
                <span className={css({ 
                  px: 2,
                  py: 1,
                  bg: 'green.100',
                  color: 'green.800',
                  fontSize: 'xs',
                  fontWeight: 'semibold',
                  rounded: 'md'
                })}>
                  Clear
                </span>
              </div>
            </div>

            {/* Sample 2 */}
            <div className={css({ 
              bg: 'white',
              rounded: '2xl',
              p: 8,
              shadow: 'lg',
              border: '2px solid',
              borderColor: 'gray.100'
            })}>
              <h3 className={css({ 
                fontSize: 'xl',
                fontWeight: 'bold',
                color: 'gray.900',
                mb: 2
              })}>
                Accent Control
              </h3>
              <p className={css({ 
                fontSize: 'sm',
                color: 'gray.600',
                mb: 6,
                lineHeight: '1.6'
              })}>
                "Advanced AI models can adapt to different accents and speaking styles seamlessly."
              </p>
              <audio 
                controls 
                className={css({ 
                  w: 'full',
                  h: 12,
                  rounded: 'lg'
                })}
              >
                <source src="/demo/tts-sample-2.mp3" type="audio/mpeg" />
                Your browser does not support the audio element.
              </audio>
              <div className={flex({ 
                mt: 4,
                gap: 2,
                flexWrap: 'wrap'
              })}>
                <span className={css({ 
                  px: 2,
                  py: 1,
                  bg: 'purple.100',
                  color: 'purple.800',
                  fontSize: 'xs',
                  fontWeight: 'semibold',
                  rounded: 'md'
                })}>
                  Adaptive
                </span>
                <span className={css({ 
                  px: 2,
                  py: 1,
                  bg: 'orange.100',
                  color: 'orange.800',
                  fontSize: 'xs',
                  fontWeight: 'semibold',
                  rounded: 'md'
                })}>
                  Natural
                </span>
              </div>
            </div>

            {/* Sample 3 */}
            <div className={css({ 
              bg: 'white',
              rounded: '2xl',
              p: 8,
              shadow: 'lg',
              border: '2px solid',
              borderColor: 'gray.100'
            })}>
              <h3 className={css({ 
                fontSize: 'xl',
                fontWeight: 'bold',
                color: 'gray.900',
                mb: 2
              })}>
                Text-based Controllability
              </h3>
              <p className={css({ 
                fontSize: 'sm',
                color: 'gray.600',
                mb: 6,
                lineHeight: '1.6'
              })}>
                "You can control tone, pace, and emotion through simple text formatting and context."
              </p>
              <audio 
                controls 
                className={css({ 
                  w: 'full',
                  h: 12,
                  rounded: 'lg'
                })}
              >
                <source src="/demo/tts-sample-3.mp3" type="audio/mpeg" />
                Your browser does not support the audio element.
              </audio>
              <div className={flex({ 
                mt: 4,
                gap: 2,
                flexWrap: 'wrap'
              })}>
                <span className={css({ 
                  px: 2,
                  py: 1,
                  bg: 'pink.100',
                  color: 'pink.800',
                  fontSize: 'xs',
                  fontWeight: 'semibold',
                  rounded: 'md'
                })}>
                  Controllable
                </span>
                <span className={css({ 
                  px: 2,
                  py: 1,
                  bg: 'yellow.100',
                  color: 'yellow.800',
                  fontSize: 'xs',
                  fontWeight: 'semibold',
                  rounded: 'md'
                })}>
                  Flexible
                </span>
              </div>
            </div>

            {/* Sample 4 */}
            <div className={css({ 
              bg: 'white',
              rounded: '2xl',
              p: 8,
              shadow: 'lg',
              border: '2px solid',
              borderColor: 'gray.100'
            })}>
              <h3 className={css({ 
                fontSize: 'xl',
                fontWeight: 'bold',
                color: 'gray.900',
                mb: 2
              })}>
                Case Sensitive
              </h3>
              <p className={css({ 
                fontSize: 'sm',
                color: 'gray.600',
                mb: 6,
                lineHeight: '1.6'
              })}>
                "Proper pronunciation of acronyms like NASA, FBI, and technical terms is handled perfectly."
              </p>
              <audio 
                controls 
                className={css({ 
                  w: 'full',
                  h: 12,
                  rounded: 'lg'
                })}
              >
                <source src="/demo/tts-sample-4.mp3" type="audio/mpeg" />
                Your browser does not support the audio element.
              </audio>
              <div className={flex({ 
                mt: 4,
                gap: 2,
                flexWrap: 'wrap'
              })}>
                <span className={css({ 
                  px: 2,
                  py: 1,
                  bg: 'teal.100',
                  color: 'teal.800',
                  fontSize: 'xs',
                  fontWeight: 'semibold',
                  rounded: 'md'
                })}>
                  Accurate
                </span>
                <span className={css({ 
                  px: 2,
                  py: 1,
                  bg: 'indigo.100',
                  color: 'indigo.800',
                  fontSize: 'xs',
                  fontWeight: 'semibold',
                  rounded: 'md'
                })}>
                  Technical
                </span>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className={css({ 
            textAlign: 'center',
            mt: 8
          })}>
            <Link
              href="/tts/new"
              className={css({ 
                display: 'inline-flex',
                alignItems: 'center',
                gap: 2,
                px: 6,
                py: 3,
                bg: 'blue.600',
                color: 'white',
                fontWeight: 'bold',
                rounded: 'lg',
                fontSize: 'base',
                _hover: { bg: 'blue.700' },
                transition: 'all',
                shadow: 'lg'
              })}
            >
              <span>Try Text-to-Speech</span>
              <span>→</span>
            </Link>
          </div>
        </div>

        {/* AI Covers Section */}
        <div>
          <div className={css({ 
            textAlign: 'center',
            mb: 8
          })}>
            <h2 className={css({ 
              fontSize: { base: '3xl', lg: '4xl' },
              fontWeight: 'extrabold',
              color: 'gray.900',
              mb: 3
            })}>
              🎵 AI Voice Covers
            </h2>
            <p className={css({ 
              fontSize: 'lg',
              color: 'gray.600'
            })}>
              Transform any song with AI voice conversion
            </p>
          </div>

          <div className={grid({ columns: { base: 1, lg: 2 }, gap: 6 })}>
            {/* Cover Sample 1 */}
            <div className={css({ 
              bg: 'white',
              rounded: '2xl',
              p: 8,
              shadow: 'lg',
              border: '2px solid',
              borderColor: 'gray.100'
            })}>
              <div className={flex({ alignItems: 'center', gap: 3, mb: 4 })}>
                <div className={css({ 
                  w: 16,
                  h: 16,
                  bg: 'gradient.to.br',
                  gradientFrom: 'purple.400',
                  gradientTo: 'pink.500',
                  rounded: 'xl',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '2xl'
                })}>
                  🎸
                </div>
                <div>
                  <h3 className={css({ 
                    fontSize: 'xl',
                    fontWeight: 'bold',
                    color: 'gray.900'
                  })}>
                    Pop Rock Cover
                  </h3>
                  <p className={css({ 
                    fontSize: 'sm',
                    color: 'gray.500'
                  })}>
                    Original: Male Voice → AI: Female Voice
                  </p>
                </div>
              </div>
              
              <div className={css({ mb: 4 })}>
                <p className={css({ 
                  fontSize: 'xs',
                  fontWeight: 'semibold',
                  color: 'gray.600',
                  mb: 2
                })}>
                  Original
                </p>
                <audio 
                  controls 
                  className={css({ 
                    w: 'full',
                    h: 10,
                    rounded: 'lg',
                    mb: 3
                  })}
                >
                  <source src="/demo/cover-original-1.mp3" type="audio/mpeg" />
                </audio>

                <p className={css({ 
                  fontSize: 'xs',
                  fontWeight: 'semibold',
                  color: 'green.700',
                  mb: 2
                })}>
                  AI Cover
                </p>
                <audio 
                  controls 
                  className={css({ 
                    w: 'full',
                    h: 10,
                    rounded: 'lg'
                  })}
                >
                  <source src="/demo/cover-ai-1.mp3" type="audio/mpeg" />
                </audio>
              </div>

              <div className={flex({ 
                gap: 2,
                flexWrap: 'wrap'
              })}>
                <span className={css({ 
                  px: 2,
                  py: 1,
                  bg: 'purple.100',
                  color: 'purple.800',
                  fontSize: 'xs',
                  fontWeight: 'semibold',
                  rounded: 'md'
                })}>
                  Pop Rock
                </span>
                <span className={css({ 
                  px: 2,
                  py: 1,
                  bg: 'pink.100',
                  color: 'pink.800',
                  fontSize: 'xs',
                  fontWeight: 'semibold',
                  rounded: 'md'
                })}>
                  Pitch +2
                </span>
              </div>
            </div>

            {/* Cover Sample 2 */}
            <div className={css({ 
              bg: 'white',
              rounded: '2xl',
              p: 8,
              shadow: 'lg',
              border: '2px solid',
              borderColor: 'gray.100'
            })}>
              <div className={flex({ alignItems: 'center', gap: 3, mb: 4 })}>
                <div className={css({ 
                  w: 16,
                  h: 16,
                  bg: 'gradient.to.br',
                  gradientFrom: 'blue.400',
                  gradientTo: 'cyan.500',
                  rounded: 'xl',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '2xl'
                })}>
                  🎹
                </div>
                <div>
                  <h3 className={css({ 
                    fontSize: 'xl',
                    fontWeight: 'bold',
                    color: 'gray.900'
                  })}>
                    Ballad Cover
                  </h3>
                  <p className={css({ 
                    fontSize: 'sm',
                    color: 'gray.500'
                  })}>
                    Original: Female Voice → AI: Male Voice
                  </p>
                </div>
              </div>
              
              <div className={css({ mb: 4 })}>
                <p className={css({ 
                  fontSize: 'xs',
                  fontWeight: 'semibold',
                  color: 'gray.600',
                  mb: 2
                })}>
                  Original
                </p>
                <audio 
                  controls 
                  className={css({ 
                    w: 'full',
                    h: 10,
                    rounded: 'lg',
                    mb: 3
                  })}
                >
                  <source src="/demo/cover-original-2.mp3" type="audio/mpeg" />
                </audio>

                <p className={css({ 
                  fontSize: 'xs',
                  fontWeight: 'semibold',
                  color: 'green.700',
                  mb: 2
                })}>
                  AI Cover
                </p>
                <audio 
                  controls 
                  className={css({ 
                    w: 'full',
                    h: 10,
                    rounded: 'lg'
                  })}
                >
                  <source src="/demo/cover-ai-2.mp3" type="audio/mpeg" />
                </audio>
              </div>

              <div className={flex({ 
                gap: 2,
                flexWrap: 'wrap'
              })}>
                <span className={css({ 
                  px: 2,
                  py: 1,
                  bg: 'blue.100',
                  color: 'blue.800',
                  fontSize: 'xs',
                  fontWeight: 'semibold',
                  rounded: 'md'
                })}>
                  Ballad
                </span>
                <span className={css({ 
                  px: 2,
                  py: 1,
                  bg: 'cyan.100',
                  color: 'cyan.800',
                  fontSize: 'xs',
                  fontWeight: 'semibold',
                  rounded: 'md'
                })}>
                  Pitch -3
                </span>
              </div>
            </div>

            {/* Cover Sample 3 */}
            <div className={css({ 
              bg: 'white',
              rounded: '2xl',
              p: 8,
              shadow: 'lg',
              border: '2px solid',
              borderColor: 'gray.100'
            })}>
              <div className={flex({ alignItems: 'center', gap: 3, mb: 4 })}>
                <div className={css({ 
                  w: 16,
                  h: 16,
                  bg: 'gradient.to.br',
                  gradientFrom: 'orange.400',
                  gradientTo: 'red.500',
                  rounded: 'xl',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '2xl'
                })}>
                  🎤
                </div>
                <div>
                  <h3 className={css({ 
                    fontSize: 'xl',
                    fontWeight: 'bold',
                    color: 'gray.900'
                  })}>
                    R&B Cover
                  </h3>
                  <p className={css({ 
                    fontSize: 'sm',
                    color: 'gray.500'
                  })}>
                    Original: Studio → AI: Your Voice
                  </p>
                </div>
              </div>
              
              <div className={css({ mb: 4 })}>
                <p className={css({ 
                  fontSize: 'xs',
                  fontWeight: 'semibold',
                  color: 'gray.600',
                  mb: 2
                })}>
                  Original
                </p>
                <audio 
                  controls 
                  className={css({ 
                    w: 'full',
                    h: 10,
                    rounded: 'lg',
                    mb: 3
                  })}
                >
                  <source src="/demo/cover-original-3.mp3" type="audio/mpeg" />
                </audio>

                <p className={css({ 
                  fontSize: 'xs',
                  fontWeight: 'semibold',
                  color: 'green.700',
                  mb: 2
                })}>
                  AI Cover
                </p>
                <audio 
                  controls 
                  className={css({ 
                    w: 'full',
                    h: 10,
                    rounded: 'lg'
                  })}
                >
                  <source src="/demo/cover-ai-3.mp3" type="audio/mpeg" />
                </audio>
              </div>

              <div className={flex({ 
                gap: 2,
                flexWrap: 'wrap'
              })}>
                <span className={css({ 
                  px: 2,
                  py: 1,
                  bg: 'orange.100',
                  color: 'orange.800',
                  fontSize: 'xs',
                  fontWeight: 'semibold',
                  rounded: 'md'
                })}>
                  R&B
                </span>
                <span className={css({ 
                  px: 2,
                  py: 1,
                  bg: 'red.100',
                  color: 'red.800',
                  fontSize: 'xs',
                  fontWeight: 'semibold',
                  rounded: 'md'
                })}>
                  Original Pitch
                </span>
              </div>
            </div>

            {/* Cover Sample 4 */}
            <div className={css({ 
              bg: 'white',
              rounded: '2xl',
              p: 8,
              shadow: 'lg',
              border: '2px solid',
              borderColor: 'gray.100'
            })}>
              <div className={flex({ alignItems: 'center', gap: 3, mb: 4 })}>
                <div className={css({ 
                  w: 16,
                  h: 16,
                  bg: 'gradient.to.br',
                  gradientFrom: 'green.400',
                  gradientTo: 'emerald.500',
                  rounded: 'xl',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '2xl'
                })}>
                  🎧
                </div>
                <div>
                  <h3 className={css({ 
                    fontSize: 'xl',
                    fontWeight: 'bold',
                    color: 'gray.900'
                  })}>
                    Electronic Cover
                  </h3>
                  <p className={css({ 
                    fontSize: 'sm',
                    color: 'gray.500'
                  })}>
                    Original: Synth Voice → AI: Natural Voice
                  </p>
                </div>
              </div>
              
              <div className={css({ mb: 4 })}>
                <p className={css({ 
                  fontSize: 'xs',
                  fontWeight: 'semibold',
                  color: 'gray.600',
                  mb: 2
                })}>
                  Original
                </p>
                <audio 
                  controls 
                  className={css({ 
                    w: 'full',
                    h: 10,
                    rounded: 'lg',
                    mb: 3
                  })}
                >
                  <source src="/demo/cover-original-4.mp3" type="audio/mpeg" />
                </audio>

                <p className={css({ 
                  fontSize: 'xs',
                  fontWeight: 'semibold',
                  color: 'green.700',
                  mb: 2
                })}>
                  AI Cover
                </p>
                <audio 
                  controls 
                  className={css({ 
                    w: 'full',
                    h: 10,
                    rounded: 'lg'
                  })}
                >
                  <source src="/demo/cover-ai-4.mp3" type="audio/mpeg" />
                </audio>
              </div>

              <div className={flex({ 
                gap: 2,
                flexWrap: 'wrap'
              })}>
                <span className={css({ 
                  px: 2,
                  py: 1,
                  bg: 'green.100',
                  color: 'green.800',
                  fontSize: 'xs',
                  fontWeight: 'semibold',
                  rounded: 'md'
                })}>
                  Electronic
                </span>
                <span className={css({ 
                  px: 2,
                  py: 1,
                  bg: 'emerald.100',
                  color: 'emerald.800',
                  fontSize: 'xs',
                  fontWeight: 'semibold',
                  rounded: 'md'
                })}>
                  Pitch +1
                </span>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className={css({ 
            textAlign: 'center',
            mt: 8
          })}>
            <Link
              href="/covers/new"
              className={css({ 
                display: 'inline-flex',
                alignItems: 'center',
                gap: 2,
                px: 6,
                py: 3,
                bg: 'green.600',
                color: 'white',
                fontWeight: 'bold',
                rounded: 'lg',
                fontSize: 'base',
                _hover: { bg: 'green.700' },
                transition: 'all',
                shadow: 'lg'
              })}
            >
              <span>Create Your AI Cover</span>
              <span>→</span>
            </Link>
          </div>
        </div>

        {/* Features Grid */}
        <div className={css({ 
          mt: 20,
          bg: 'white',
          rounded: '2xl',
          p: { base: 8, lg: 12 },
          shadow: 'xl',
          border: '2px solid',
          borderColor: 'gray.100'
        })}>
          <h2 className={css({ 
            fontSize: { base: '2xl', lg: '3xl' },
            fontWeight: 'extrabold',
            color: 'gray.900',
            mb: 8,
            textAlign: 'center'
          })}>
            ✨ Key Features
          </h2>
          
          <div className={grid({ columns: { base: 1, md: 2, lg: 3 }, gap: 6 })}>
            <div className={css({ textAlign: 'center' })}>
              <div className={css({ fontSize: '4xl', mb: 3 })}>🎯</div>
              <h3 className={css({ fontWeight: 'bold', color: 'gray.900', mb: 2 })}>
                High Quality
              </h3>
              <p className={css({ fontSize: 'sm', color: 'gray.600' })}>
                Studio-grade audio generation with professional results
              </p>
            </div>

            <div className={css({ textAlign: 'center' })}>
              <div className={css({ fontSize: '4xl', mb: 3 })}>⚡</div>
              <h3 className={css({ fontWeight: 'bold', color: 'gray.900', mb: 2 })}>
                Fast Processing
              </h3>
              <p className={css({ fontSize: 'sm', color: 'gray.600' })}>
                Generate voice content in seconds, not hours
              </p>
            </div>

            <div className={css({ textAlign: 'center' })}>
              <div className={css({ fontSize: '4xl', mb: 3 })}>🎨</div>
              <h3 className={css({ fontWeight: 'bold', color: 'gray.900', mb: 2 })}>
                Full Control
              </h3>
              <p className={css({ fontSize: 'sm', color: 'gray.600' })}>
                Adjust pitch, tone, and style to match your vision
              </p>
            </div>

            <div className={css({ textAlign: 'center' })}>
              <div className={css({ fontSize: '4xl', mb: 3 })}>🔒</div>
              <h3 className={css({ fontWeight: 'bold', color: 'gray.900', mb: 2 })}>
                Secure & Private
              </h3>
              <p className={css({ fontSize: 'sm', color: 'gray.600' })}>
                Your voice data is encrypted and protected
              </p>
            </div>

            <div className={css({ textAlign: 'center' })}>
              <div className={css({ fontSize: '4xl', mb: 3 })}>🌍</div>
              <h3 className={css({ fontWeight: 'bold', color: 'gray.900', mb: 2 })}>
                Multi-Language
              </h3>
              <p className={css({ fontSize: 'sm', color: 'gray.600' })}>
                Support for multiple languages and accents
              </p>
            </div>

            <div className={css({ textAlign: 'center' })}>
              <div className={css({ fontSize: '4xl', mb: 3 })}>💎</div>
              <h3 className={css({ fontWeight: 'bold', color: 'gray.900', mb: 2 })}>
                Professional Use
              </h3>
              <p className={css({ fontSize: 'sm', color: 'gray.600' })}>
                Perfect for content creators and businesses
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}